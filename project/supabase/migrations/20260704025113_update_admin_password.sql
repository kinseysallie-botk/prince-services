/*
# Update admin password to cyberhub2024
*/

UPDATE admin_config SET password_hash = crypt('cyberhub2024', gen_salt('bf', 8));