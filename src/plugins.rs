use crate::errors::Error;
use serde_json::Value;
use std::path::PathBuf;
use wasmtime::{
    component::{
        bindgen, types::ComponentItem, Component, HasSelf, Linker, ResourceTable, Type, Val,
    },
    Config, Engine, Result, Store,
};
use wasmtime_wasi::{WasiCtx, WasiCtxView, WasiView};

bindgen!("lucleworld" in "wit/lucle.wit");

struct HostComponent;

impl host::Host for HostComponent {
    fn logs(&mut self, message: String) {
        println!("{message}");
    }
}

pub struct ComponentRunStates {
    pub wasi_ctx: WasiCtx,
    pub resource_table: ResourceTable,
    host: HostComponent,
}

impl WasiView for ComponentRunStates {
    fn ctx(&mut self) -> WasiCtxView<'_> {
        WasiCtxView {
            ctx: &mut self.wasi_ctx,
            table: &mut self.resource_table,
        }
    }
}

#[derive(Clone)]
pub struct PluginSystem {
    engine: Engine,
}

impl PluginSystem {
    pub fn new() -> Self {
        let mut config = Config::new();
        config.wasm_component_model_async(true);
        let engine = Engine::new(&config)
            .unwrap_or_else(|err| panic!("Unable to start wasm runtime: {}", err));
        Self { engine }
    }

    pub async fn call(
        &self,
        plugin_dir: PathBuf,
        plugin_name: String,
        function: String,
        args: Vec<Val>,
    ) -> Result<Value, Error> {
        let mut linker = Linker::new(&self.engine);
        wasmtime_wasi::p3::add_to_linker(&mut linker)?;
        let wasi = WasiCtx::builder().inherit_stdio().inherit_stderr().build();
        let state = ComponentRunStates {
            wasi_ctx: wasi,
            resource_table: ResourceTable::new(),
            host: HostComponent {},
        };

        let mut store = Store::new(&self.engine, state);
        host::add_to_linker::<_, HasSelf<_>>(&mut linker, |state: &mut ComponentRunStates| {
            &mut state.host
        })?;

        let plugin_absolute_path = plugin_dir
            .join(&plugin_name)
            .join(plugin_name)
            .with_extension("wasm");
        let component = Component::from_file(&self.engine, plugin_absolute_path)?;

        let component_type = component.component_type();
        let exports_iter = component_type.exports(&self.engine);
        let mut instance_name = "";
        for (name, export_type) in exports_iter {
            if let ComponentItem::ComponentInstance(_) = export_type.ty {
                instance_name = name;
            }
        }

        let instance = linker.instantiate_async(&mut store, &component).await?;
        let instance_index = instance
            .get_export_index(&mut store, None, instance_name)
            .ok_or(Error::PluginInternal(
                "instance index not found".to_string(),
            ))?;

        let func_index = instance
            .get_export_index(&mut store, Some(&instance_index), &function)
            .ok_or(Error::PluginInternal(
                "function index not found".to_string(),
            ))?;

        let func = instance
            .get_func(&mut store, func_index)
            .ok_or(Error::PluginInternal("function not found".to_string()))?;

        let func_ty = func.ty(&store);
        let result_types = func_ty.results();

        let mut results: Vec<Val> = result_types.map(default_val_from_type).collect();
        if func_ty.async_() {
            store
                .run_concurrent(async |accessor| -> Result<(), Error> {
                    func.call_concurrent(accessor, &args, &mut results).await?;
                    Ok(())
                })
                .await??
        } else {
            func.call_async(&mut store, &args, &mut results).await?
        }

        Ok(results_to_json(results))
    }
}

fn json_to_val(value: Value) -> Result<Val, Error> {
    match value {
        Value::String(s) => Ok(Val::String(s)),
        Value::Bool(b) => Ok(Val::Bool(b)),
        Value::Number(n) => {
            if let Some(i) = n.as_i64() {
                Ok(Val::S64(i))
            } else if let Some(f) = n.as_f64() {
                Ok(Val::Float64(f))
            } else {
                Err(Error::PluginInternal("unsupported number".into()))
            }
        }
        Value::Null => Err(Error::PluginInternal("null not supported".into())),
        Value::Object(_) | Value::Array(_) => Ok(Val::String(
            serde_json::to_string(&value).map_err(|e| Error::PluginInternal(e.to_string()))?,
        )),
    }
}

pub fn json_array_to_args(raw: &[u8]) -> Result<Vec<Val>, Error> {
    let arr: Vec<Value> =
        serde_json::from_slice(raw).map_err(|e| Error::PluginInternal(e.to_string()))?;
    arr.into_iter().map(json_to_val).collect()
}

fn default_val_from_type(ty: Type) -> Val {
    match ty {
        Type::Bool => Val::Bool(false),
        Type::S8 => Val::S8(0),
        Type::S16 => Val::S16(0),
        Type::S32 => Val::S32(0),
        Type::S64 => Val::S64(0),
        Type::U8 => Val::U8(0),
        Type::U16 => Val::U16(0),
        Type::U32 => Val::U32(0),
        Type::U64 => Val::U64(0),
        Type::Float32 => Val::Float32(0.0),
        Type::Float64 => Val::Float64(0.0),
        Type::String => Val::String(String::new()),
        Type::Result(result_ty) => {
            if let Some(ok_ty) = result_ty.ok() {
                Val::Result(Ok(Some(Box::new(default_val_from_type(ok_ty)))))
            } else {
                Val::Result(Ok(None))
            }
        }
        _ => unimplemented!("Type non supporté dynamiquement"),
    }
}

fn val_to_json(val: Val) -> Value {
    match val {
        Val::Bool(b) => Value::Bool(b),
        Val::S32(n) => Value::Number(n.into()),
        Val::S64(n) => Value::Number(n.into()),
        Val::U32(n) => Value::Number(n.into()),
        Val::U64(n) => Value::Number(n.into()),
        Val::Float32(f) => serde_json::Number::from_f64(f as f64)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        Val::Float64(f) => serde_json::Number::from_f64(f)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        Val::String(s) => Value::String(s),
        _ => Value::Null,
    }
}

fn results_to_json(results: Vec<Val>) -> Value {
    match results.len() {
        0 => Value::Null,
        1 => val_to_json(results.into_iter().next().unwrap()),
        _ => Value::Array(results.into_iter().map(val_to_json).collect()),
    }
}
