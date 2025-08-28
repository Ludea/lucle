use std::{fs, path::Path};
use wasmtime::component::{bindgen, Component, HasSelf, Linker, ResourceTable};
use wasmtime::*;
use wasmtime_wasi::{DirPerms, FilePerms, WasiCtx, WasiCtxBuilder, WasiCtxView, WasiView};

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

pub async fn load_wasm_runtime() -> Result<()> {
    let mut config = Config::new();
    config.async_support(true).wasm_component_model(true);
    let engine = Engine::new(&config)?;
    let mut linker = Linker::new(&engine);
    wasmtime_wasi::p2::add_to_linker_async(&mut linker)?;

    let wasi = WasiCtxBuilder::new()
        .inherit_stdio()
        .inherit_stdout()
        .inherit_args()
        .preopened_dir(".", ".", DirPerms::all(), FilePerms::all())?
        .build();

    let state = ComponentRunStates {
        wasi_ctx: wasi,
        resource_table: ResourceTable::new(),
        host: HostComponent {},
    };
    let mut store = Store::new(&engine, state);
    host::add_to_linker::<_, HasSelf<_>>(&mut linker, |state: &mut ComponentRunStates| {
        &mut state.host
    })?;

    let plugins_path = Path::new("plugins");
    if plugins_path.is_dir() {
        for entry in fs::read_dir(plugins_path).unwrap() {
            let entry = entry.unwrap();
            let file_path = entry.path();
            if file_path.is_file() {
                if let Some(extension) = file_path.clone().extension() {
                    if extension == "wasm" {
                        let component = Component::from_file(&engine, file_path)?;
                        let instance = linker.instantiate_async(&mut store, &component).await?;
                        let func = instance
                            .get_func(&mut store, "start")
                            .expect("function run not found");
                        let mut result = []; //[wasmtime::component::Val::String("".into())];
                        func.call_async(&mut store, &[], &mut result).await?;
                    }
                }
            }
        }
    }
    Ok(())
}
