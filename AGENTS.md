# Architecture rules

- Employee account invitations must pass server-side HR authorization in the existing onboarding function; hidden controls alone do not enforce access.- Page access resolves from saved role permissions (access_permissions) first, falling back to the code matrix; why: the Roles & Permissions page must actually control access.
