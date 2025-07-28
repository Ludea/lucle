use std::{env, fs, path::PathBuf};

use protox::prost::Message;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let file_descriptors = protox::compile(["proto/lucle.proto"], ["."]).unwrap();

    let file_descriptor_path = PathBuf::from(env::var_os("OUT_DIR").expect("OUT_DIR not set"))
        .join("file_descriptor_set.bin");
    fs::write(&file_descriptor_path, file_descriptors.encode_to_vec()).unwrap();

    tonic_prost_build::configure()
        .skip_protoc_run()
        .protoc_arg("--experimental_allow_proto3_optional")
        .file_descriptor_set_path(&file_descriptor_path)
        .compile_protos(&["proto/lucle.proto"], &["proto"])?;
    Ok(())
}
