/*
# Fix register_device function column name typo

The previous migration introduced a bug in register_device: the INSERT
statement used `p_platform` (the parameter name) as a column name instead
of `platform` (the actual column). This corrects it.
*/

CREATE OR REPLACE FUNCTION public.register_device(
  p_fingerprint text,
  p_device_name text,
  p_platform text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $function$
DECLARE
  existing_id uuid;
BEGIN
  SELECT id INTO existing_id
  FROM user_devices
  WHERE user_id = auth.uid() AND device_fingerprint = p_fingerprint
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    UPDATE user_devices
    SET last_seen_at = now(), device_name = p_device_name, platform = p_platform
    WHERE id = existing_id;
    RETURN existing_id;
  END IF;

  INSERT INTO user_devices (user_id, device_fingerprint, device_name, platform)
  VALUES (auth.uid(), p_fingerprint, p_device_name, p_platform)
  RETURNING id INTO existing_id;

  RETURN existing_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.register_device(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_device(text, text, text) TO authenticated;
