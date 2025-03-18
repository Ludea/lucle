use std::{fs, path::Path};
use wasmtime::component::{Component, Linker, ResourceTable};
use wasmtime::*;
use wasmtime_wasi::bindings::Command;
use wasmtime_wasi::{IoView, WasiCtx, WasiCtxBuilder, WasiView};

pub struct ComponentRunStates {
    pub wasi_ctx: WasiCtx,
    pub resource_table: ResourceTable,
}

impl IoView for ComponentRunStates {
    fn table(&mut self) -> &mut ResourceTable {
        &mut self.resource_table
    }
}
impl WasiView for ComponentRunStates {
    fn ctx(&mut self) -> &mut WasiCtx {
        &mut self.wasi_ctx
    }
}

pub async fn load_wasm_runtime() -> Result<()> {
    let mut config = Config::new();
    config.async_support(true);
    let engine = Engine::default(&config)?;
    let mut linker = Linker::new(&engine);
    wasmtime_wasi::add_to_linker_sync(&mut linker)?;

    let wasi = WasiCtxBuilder::new().inherit_stdio().inherit_args().build();
    let state = ComponentRunStates {
        wasi_ctx: wasi,
        resource_table: ResourceTable::new(),
    };
    let mut store = Store::new(&engine, state);

    let plugins_path = Path::new("plugins");
    for entry in fs::read_dir(plugins_path).unwrap() {
        let entry = entry.unwrap();
        let file_path = entry.path();
        if file_path.is_file() {
            if let Some(extension) = file_path.clone().extension() {
                if extension == "wasm" {
                    if let Some(filename) = file_path
                        .clone()
                        .file_name()
                        .and_then(|f| Some(f.to_str()?.to_string()))
                    {
                        let component = Component::from_file(&engine, filename)?;
                        let command =
                            Command::instantiate_async(&mut store, &component, &linker).await?;
                        let program_result = command.wasi_cli_run().call_run(&mut store).await?;
                        match program_result {
                            Ok(()) => Ok(()),
                            Err(()) => std::process::exit(1),
                        };
                    }
                }
            }
        }
    }
    Ok(())
}
