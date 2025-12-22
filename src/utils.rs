use crate::errors::Error;
use jsonwebtoken::{encode, get_current_timestamp, Algorithm, EncodingKey};
use lettre::{
    message::{header, MultiPart, SinglePart},
    FileTransport, Message, Transport,
};
use serde::{Deserialize, Serialize};
use std::{
    env,
    fs::{self, OpenOptions},
    io::{self, ErrorKind, Read, Write},
    path::Path,
};
use tera::{Context, Tera};
use toml::Table;
use toml_edit::{value, DocumentMut};

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    email: String,
    exp: u64,
    scope: Vec<String>,
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

pub fn generate_jwt(username: String, email: String, repo: Vec<String>) -> Result<String, Error> {
    let pem = match load_jwt_private_key() {
        Ok(pkey) => pkey,
        Err(err) => {
            tracing::error!("Unable to get private key, you have to set JWT_PKEY into .env file or create a key file into /etc/lucle/lucle.key: {}", err);
            String::new()
        }
    };
    let encoding_key = EncodingKey::from_ec_der(pem.as_bytes());

    let claims = Claims {
        sub: username,
        email,
        exp: get_current_timestamp(),
        scope: repo,
    };

    match encode(
        &jsonwebtoken::Header::new(Algorithm::ES256),
        &claims,
        &encoding_key,
    ) {
        Ok(token) => Ok(token),
        Err(err) => Err(Error::Jwt(err)),
    }
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
            if let Err(err) = content.parse::<Table>() {
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

pub fn load_jwt_private_key() -> std::io::Result<String> {
    if let Ok(pkey) = env::var("JWT_PKEY") {
        if !pkey.trim().is_empty() {
            return Ok(pkey);
        }
    }
    fs::read_to_string("/etc/lucle/jwt_pkey")
}

pub fn has_jwt_private_key() -> Option<()> {
    let env_set = env::var("JWT_PKEY")
        .ok()
        .filter(|v| !v.trim().is_empty())
        .map(|_| ());

    let dotenv_file_set = Path::new(".env").is_file().then_some(());

    let key_file_set = Path::new("/etc/lucle/jwt_pkey").is_file().then_some(());

    env_set.or(dotenv_file_set).or(key_file_set)
}
