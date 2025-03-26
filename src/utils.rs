use base64::{engine::general_purpose, Engine as _};
use jsonwebtoken::{encode, get_current_timestamp, Algorithm, EncodingKey};
use lettre::{
    message::{header, MultiPart, SinglePart},
    FileTransport, Message, Transport,
};
use rcgen::{DnType, KeyPair, KeyUsagePurpose};
use serde::{Deserialize, Serialize};
use std::{
    fs::{self, File, OpenOptions},
    io::{self, ErrorKind, Read, Result, Write},
};
use tera::{Context, Tera};
use time::{Duration, OffsetDateTime};
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
            println!("Parsing error(s): {}", e);
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

pub struct Pki {
    pub ca_cert: rcgen::CertifiedKey,
    pub server_cert: rcgen::CertifiedKey,
}

impl Pki {
    pub fn new() -> Self {
        let alg = &rcgen::PKCS_ECDSA_P256_SHA256;
        let mut ca_params = rcgen::CertificateParams::new(Vec::new()).unwrap();
        let (yesterday, tomorrow) = validity_period();
        ca_params
            .distinguished_name
            .push(DnType::OrganizationName, "Rustls Server Acceptor");
        ca_params
            .distinguished_name
            .push(DnType::CommonName, "Example CA");
        ca_params.is_ca = rcgen::IsCa::Ca(rcgen::BasicConstraints::Unconstrained);
        ca_params.key_usages = vec![
            KeyUsagePurpose::KeyCertSign,
            KeyUsagePurpose::DigitalSignature,
            KeyUsagePurpose::CrlSign,
        ];
        ca_params.not_before = yesterday;
        ca_params.not_after = tomorrow;
        let ca_key = KeyPair::generate_for(alg).unwrap();
        let ca_cert = ca_params.self_signed(&ca_key).unwrap();

        let mut server_ee_params =
            rcgen::CertificateParams::new(vec!["localhost".to_string()]).unwrap();
        server_ee_params.is_ca = rcgen::IsCa::NoCa;
        let (yesterday, tomorrow) = validity_period();
        server_ee_params
            .distinguished_name
            .push(DnType::CommonName, "localhost");
        server_ee_params.use_authority_key_identifier_extension = true;
        server_ee_params
            .key_usages
            .push(KeyUsagePurpose::DigitalSignature);
        server_ee_params.not_before = yesterday;
        server_ee_params.not_after = tomorrow;
        let ee_key = KeyPair::generate_for(alg).unwrap();
        let server_cert = server_ee_params
            .signed_by(&ee_key, &ca_cert, &ca_key)
            .unwrap();

        Self {
            ca_cert: rcgen::CertifiedKey {
                cert: ca_cert,
                key_pair: ca_key,
            },
            server_cert: rcgen::CertifiedKey {
                cert: server_cert,
                key_pair: ee_key,
            },
        }
    }
}
fn validity_period() -> (OffsetDateTime, OffsetDateTime) {
    let day = Duration::new(86400, 0);
    let yesterday = OffsetDateTime::now_utc().checked_sub(day).unwrap();
    let tomorrow = OffsetDateTime::now_utc().checked_add(day).unwrap();
    (yesterday, tomorrow)
}

pub fn write_pem(path: &str, pem: &str) -> Result<()> {
    let mut file = File::create(path)?;
    file.write_all(pem.as_bytes())?;
    Ok(())
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
        section.get(key).map(|key| key.to_string())
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
[database]
name = ""
url = ""
"#;

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
            tracing::info!("Config file created");
            Ok(())
        }
        Err(err) => Err(io::Error::other(err.to_string())),
    }
}
