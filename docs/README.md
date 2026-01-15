# Building Status Documentation

## Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) documenting significant architectural and technical decisions made for the Building Status project.

### What is an ADR?

An Architecture Decision Record captures an important architectural decision made along with its context and consequences. ADRs help teams:

- Understand the reasoning behind technical choices
- Avoid revisiting settled decisions
- Onboard new team members faster
- Track the evolution of the architecture

### ADR Format

Each ADR follows this structure:

1. **Status**: Proposed | Accepted | Deprecated | Superseded
2. **Context**: The situation prompting the decision
3. **Decision**: What we decided to do
4. **Consequences**: The positive and negative outcomes
5. **Alternatives**: Other options considered and why they were rejected

### Current ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](adr/001-migrate-to-nextjs-typescript-database.md) | Migrate to Next.js + TypeScript + Database | Proposed | 2026-01-15 |

### Creating a New ADR

1. Copy the template (if one exists) or use an existing ADR as reference
2. Number it sequentially (e.g., `002-your-decision.md`)
3. Fill in all sections
4. Submit as part of your pull request
5. Update this README's ADR table

### ADR Lifecycle

- **Proposed**: Initial proposal, under discussion
- **Accepted**: Decision approved and being implemented
- **Deprecated**: No longer follows this approach (explain why in ADR)
- **Superseded**: Replaced by another ADR (link to the new one)

## Other Documentation

### Project Documentation
- [SPEC.md](../SPEC.md) - Product specification and feature requirements
- [MVP-ROADMAP.md](../MVP-ROADMAP.md) - Implementation roadmap and phases
- [SETUP.md](../SETUP.md) - Deployment and configuration guide
- [README.md](../README.md) - Project overview and quick start

### API Documentation
*(To be added when API routes are implemented)*

### Database Documentation
*(To be added when database schema is finalized)*

## Contributing

When making significant architectural or technical decisions:

1. **Create an ADR** if the decision:
   - Affects the overall architecture
   - Has long-term consequences
   - Involves trade-offs between alternatives
   - Impacts other team members

2. **Update existing docs** when:
   - Features are implemented
   - APIs change
   - Setup process changes
   - Dependencies are updated

3. **Keep it current**:
   - Update ADR status as decisions progress
   - Mark superseded ADRs
   - Link related ADRs

## Questions?

For questions about architectural decisions or documentation:
- Review existing ADRs for context
- Check related documentation
- Ask in project discussions
