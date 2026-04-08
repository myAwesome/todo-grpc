# todo-grpc

Minimal Todo app over gRPC (Node.js) with:
- Node.js server
- Node.js CLI client
- Go CLI client

## Setup

```bash
npm install
```

## Run server

```bash
npm run server
```

By default it listens on `0.0.0.0:50051`. Override with:

```bash
GRPC_ADDR=0.0.0.0:50052 npm run server
```

## Run client

In another terminal:

```bash
npm run client -- add "buy milk"
npm run client -- list
npm run client -- complete 1
npm run client -- delete 1
```

If needed, point client at another address:

```bash
GRPC_ADDR=localhost:50052 npm run client -- list
```

## Run Go client

Use Go 1.21+:

```bash
go run ./cmd/go-client -- add "buy milk"
go run ./cmd/go-client -- list
go run ./cmd/go-client -- complete 1
go run ./cmd/go-client -- delete 1
```

Or via npm shortcut:

```bash
npm run client:go -- add "buy milk"
```

If needed, point client at another address:

```bash
GRPC_ADDR=localhost:50052 go run ./cmd/go-client -- list
```
