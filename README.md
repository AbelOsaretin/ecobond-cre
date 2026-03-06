# EcoBond CRE

Root project for the EcoBond Chainlink Runtime Environment (CRE) workflow.

## Repository Layout

- `project.yaml` - project-level CRE settings
- `secrets.yaml` - secret references used by workflows
- `first-workflow/` - TypeScript workflow package
  - `main.ts` - workflow entrypoint
  - `workflow.yaml` - workflow manifest
  - `config.staging.json` / `config.production.json` - environment configs
  - `controllers/` - workflow controllers and triggers
  - `utils/` - shared utility modules

## Quick Start

1. Install dependencies for the workflow:

```bash
cd first-workflow
bun install
```

2. Configure environment values (for example private key in `.env` if needed for chain writes):

```bash
CRE_ETH_PRIVATE_KEY=0000000000000000000000000000000000000000000000000000000000000001
```

3. Simulate from the repository root:

```bash
cd ..
cre workflow simulate first-workflow --target=staging-settings
```

## Notes

- Update `first-workflow/workflow.yaml` to point to the config file you want to use.
- Use `config.staging.json` for staging and `config.production.json` for production behavior.
