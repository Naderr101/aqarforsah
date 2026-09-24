create or replace function private.no_audit_changes() returns trigger language plpgsql set search_path = public as $$
begin raise exception 'AUDIT_APPEND_ONLY'; end $$;