import json
import os

locales_dir = os.path.dirname(os.path.abspath(__file__))

mapping = {
    'common.json': [
        'btn_back', 'btn_confirm', 'btn_cancel', 'time_just_now', 'time_min_ago', 
        'time_hours_ago', 'time_days_ago', 'error_technical', 'error_system', 
        'auth_required', 'unknown_command'
    ],
    'navigation.json': [
        'btn_profile', 'btn_info', 'btn_admin_panel', 'btn_settings', 'btn_trading', 
        'btn_education', 'start_welcome', 'start_back', 'main_menu', 'start_main_text', 
        'chat_commands_text', 'welcome_select_language'
    ],
    'profile.json': [
        'profile_title', 'label_id', 'label_nik', 'label_username', 'label_reg', 
        'no_username', 'ask_nickname', 'nick_invalid_format', 'nick_taken', 
        'nick_confirm_ask', 'nick_btn_confirm', 'nick_btn_retry', 'nick_success', 
        'nick_info_title', 'btn_change_nick', 'btn_change_nick_action', 
        'nick_cooldown_error', 'nick_change_ask', 'nick_change_confirm', 
        'nick_change_success', 'new_referral_notification'
    ],
    'settings.json': [
        'settings_title', 'btn_language', 'language_title', 'lang_ru', 'lang_en', 
        'lang_ua', 'lang_tr', 'lang_selected', 'ask_confirm_change', 'lang_changed_success', 
        'btn_notifications', 'notif_title', 'notif_on', 'notif_off', 'btn_toggle_on', 
        'btn_toggle_off'
    ],
    'security.json': [
        'btn_security', 'btn_set_password', 'btn_change_password', 'btn_logout_all', 
        'btn_sessions', 'security_title_empty', 'security_title_set', 'security_set_ask', 
        'security_set_confirm_ask', 'security_set_success', 'security_change_ask_old', 
        'security_change_ask_new', 'security_change_confirm_ask', 'security_change_success', 
        'security_old_password_wrong', 'security_password_mismatch', 'security_password_invalid', 
        'security_password_empty', 'security_password_too_short', 'security_password_too_long', 
        'security_already_has_password', 'security_no_password_yet', 'security_session_expired', 
        'security_cancelled', 'security_logout_all_confirm', 'security_logout_all_done', 
        'security_sessions_title', 'security_sessions_empty', 'security_sessions_item'
    ],
    'sections.json': [
        'info_main_text', 'trading_title', 'education_title', 'admin_panel_title', 
        'btn_admin_web', 'admin_web_hint', 'no_admin_access'
    ]
}

# Reverse mapping: key -> filename
key_to_file = {}
for filename, keys in mapping.items():
    for k in keys:
        key_to_file[k] = filename

langs = ['ru', 'en', 'ua', 'tr']

for lang in langs:
    json_path = os.path.join(locales_dir, f"{lang}.json")
    if not os.path.exists(json_path):
        continue
    
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    lang_dir = os.path.join(locales_dir, lang)
    os.makedirs(lang_dir, exist_ok=True)
    
    # split data
    split_data = {}
    for k, v in data.items():
        target_file = key_to_file.get(k, 'common.json') # fallback to common
        if target_file not in split_data:
            split_data[target_file] = {}
        split_data[target_file][k] = v
        
    for filename, content in split_data.items():
        out_path = os.path.join(lang_dir, filename)
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(content, f, ensure_ascii=False, indent=2)

    # remove old file
    os.remove(json_path)

print("Migration completed successfully.")
