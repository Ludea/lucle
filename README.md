# lucle

Open-source CMS with a Rust backend. The frontend communicates with the backend exclusively via **gRPC** (using [tonic](https://github.com/hyperium/tonic) server-side and [Connect](https://connectrpc.com/) / [connect-es](https://github.com/connectrpc/connect-es) client-side), served by an [axum](https://github.com/tokio-rs/axum) HTTP server.

## Stack

| Layer | Technology |
|---|---|
| Backend (gRPC) | Rust · [tonic](https://github.com/hyperium/tonic) |
| Backend (static) | Rust · [axum](https://github.com/tokio-rs/axum) |
| API protocol | gRPC ([Connect protocol](https://connectrpc.com/docs/protocol)) |
| Frontend | TypeScript · [connect-es](https://github.com/connectrpc/connect-es) |
| Container | Alpine 3.21 · multi-arch (amd64 / arm64) |
| Port | **8112** |

## Architecture

```
Browser
  ├─► connect-es (TypeScript gRPC client)  ──►  tonic services  ──►  business logic
  └─► static assets (HTML/JS/CSS)          ──►  axum (file server)
```

tonic handles all gRPC endpoints. axum is used solely to serve the compiled frontend (`web/dist/`). All API calls use the Connect protocol, which is compatible with both gRPC and gRPC-Web clients.

## Plugin system

lucle supports dynamic plugins via **WebAssembly Component Model** ([wasmtime](https://github.com/bytecodealliance/wasmtime)).

Plugins are `.wasm` component files loaded at runtime from the filesystem. wasmtime instantiates each component in an isolated sandbox — a plugin crash or misbehavior cannot affect the host process.

```
plugins/
  ├── my-plugin.wasm
  └── another-plugin.wasm
```

> No host WIT interface is defined yet on the lucle side. The plugin API is expected to evolve as the CMS feature set grows.

### Building a plugin

Any language that compiles to a WASM component can be used. With Rust:

```bash
cargo build --target wasm32-wasip2 --release
```

Drop the resulting `.wasm` file into the plugins directory and restart lucle.

## Requirements

### Building from source

- [Rust](https://rustup.rs/) stable toolchain
- [`protoc`](https://grpc.io/docs/protoc-installation/) — Protocol Buffers compiler
- Node.js ≥ 18 and a package manager (npm / pnpm / yarn) for the frontend
- [wasmtime](https://github.com/bytecodealliance/wasmtime) is a Rust dependency — no separate install needed

### Docker

- Docker with BuildKit / `docker buildx` for multi-arch support

## Getting started

### 1. Build the frontend

```bash
cd web
npm install
npm run build
```

Produces `web/dist/`.

### 2. Build the backend

```bash
cargo build --release
```

`protoc` must be in `PATH` — tonic-build will invoke it to compile `.proto` files at build time.

### 3. Run

```bash
./target/release/lucle
```

The server starts on `http://0.0.0.0:8112`.

## Proto definitions

API contracts live in `proto/`. After modifying a `.proto` file, re-run the build to regenerate Rust bindings (via `tonic-build`) and TypeScript bindings (via `buf` / `protoc-gen-es`).

```bash
# Rust — handled automatically by build.rs on `cargo build`

# TypeScript
buf generate
```

## Docker

The Dockerfile expects pre-built binaries and the compiled frontend to be present locally (produced by CI):

```dockerfile
FROM alpine:3.21
WORKDIR /opt/lucle
ARG TARGETARCH
COPY lucle-$TARGETARCH/lucle .
RUN chmod +x lucle
COPY web/dist ./web/dist
EXPOSE 8112
CMD ["./lucle"]
```

### Run with Docker

```bash
docker run -p 8112:8112 lucle:latest
```

## Project structure

```
lucle/
├── proto/                # Protobuf definitions (source of truth for the API)
├── plugins/              # WASM component plugins (loaded at runtime)
├── src/                  # Rust backend
│   ├── main.rs           # tonic server setup + axum static file server
│   └── ...
├── web/                  # TypeScript frontend
│   ├── src/
│   └── dist/             # Build output (served by lucle at runtime)
├── build.rs              # tonic-build invocation
├── Cargo.toml
├── Dockerfile
└── .github/workflows/    # CI — build, test, Docker publish
```

## CI / Releases

GitHub Actions builds the Rust binary for `amd64` and `arm64`, the frontend, and publishes a multi-arch Docker image.

## License

Apache License 2.0 — see [LICENSE](LICENSE).

README.md
Affichage de README.md en cours...