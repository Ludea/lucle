use base64::{engine::general_purpose, Engine as _};
use jsonwebtoken::{encode, get_current_timestamp, Algorithm, EncodingKey};
use lettre::{
    message::{header, MultiPart, SinglePart},
    FileTransport, Message, Transport,
};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, OpenOptions},
    io::{self, ErrorKind, Read, Write},
};
use tera::{Context, Tera};
use toml::Value;
use toml_edit::{value, DocumentMut};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    exp: u64,
    scope: String,
}

pub fn send_mail(from: &str, dest: &str, subject: &str, _body: &str) {
    let context = Context::new();
    let tera = match Tera::new("templates") {
        Ok(t) => t,
        Err(e) => {
            println!("Parsing error(s): {e}");
            ::std::process::exit(1);
        }
    };

    let rendered_content = tera.render("email.html", &context).unwrap();

    let email = Message::builder()
        .from(from.parse().unwrap())
        .to(dest.parse().unwrap())
        .subject(subject)
        .multipart(
            MultiPart::alternative()
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_PLAIN)
                        .body(String::from("Hello from Lettre! A mailer library for Rust")), // Every message should have a plain text fallback.
                )
                .singlepart(
                    SinglePart::builder()
                        .header(header::ContentType::TEXT_HTML)
                        .body(rendered_content),
                ),
        )
        .unwrap();

    let mailer = FileTransport::new("./");

    // Store the message when you're ready.
    mailer.send(&email).expect("failed to deliver message");
}

pub fn generate_jwt(username: String, email: String) -> String {
    let encoded_pkcs8 = fs::read_to_string("pkey").unwrap();
    let decoded_pkcs8 = general_purpose::STANDARD.decode(encoded_pkcs8).unwrap();
    let encoding_key = EncodingKey::from_ec_der(&decoded_pkcs8);

    let claims = Claims {
        sub: username,
        email,
        exp: get_current_timestamp(),
        scope: "test".to_string(),
    };

    encode(
        &jsonwebtoken::Header::new(Algorithm::ES256),
        &claims,
        &encoding_key,
    )
    .unwrap()
}

pub fn get_config_key(section: &str, key: &str) -> Option<String> {
    let config_file = ".config/lucle.toml";
    let content = fs::read_to_string(config_file).unwrap();
    let doc = content.parse::<DocumentMut>().unwrap();

    if let Some(section) = doc.get(section) {
        section.get(key)?.as_str().map(|key| key.to_string())
    } else {
        None
    }
}

pub fn set_config_key(section: &str, key: &str, val: &str) {
    let config_file = ".config/lucle.toml";
    let content = fs::read_to_string(config_file).unwrap();
    let mut doc = content.parse::<DocumentMut>().expect("invalid doc");
    doc[section][key] = value(val);
    if let Err(err) = fs::write(config_file, doc.to_string()) {
        tracing::error!("Unable to write config file: {}", err);
    }
}

pub fn create_config_file() -> std::result::Result<(), std::io::Error> {
    let default_config = r#"
######################################
#####				             #####
#####	   Lucle Settings	     #####
#####				             #####
######################################
[database]
type = ""
url = ""
port = ""
name = ""
user = ""
password = ""
"#;

    if let Err(err) = fs::create_dir_all(".config") {
        tracing::error!("{}", err);
    }

    let mut content = String::new();
    match fs::File::open(".config/lucle.toml") {
        Ok(mut file) => {
            file.read_to_string(&mut content)?;
            if let Err(err) = content.parse::<Value>() {
                tracing::error!("error on parsing file: {}", err);
                Err(io::Error::other(err.to_string()))
            } else {
                Ok(())
            }
        }
        Err(err) if err.kind() == ErrorKind::NotFound => {
            tracing::info!("Creating config file");
            let mut file = OpenOptions::new()
                .write(true)
                .create(true)
                .truncate(true)
                .open(".config/lucle.toml")?;
            file.write_all(default_config.as_bytes())?;
            Ok(())
        }
        Err(err) => Err(io::Error::other(err.to_string())),
    }
}
