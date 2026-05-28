import os

files_to_update = [
    "app/admin/books/page.module.css",
    "app/admin/orders/page.module.css",
    "app/admin/categories/page.module.css",
    "app/admin/hero/page.module.css",
    "app/admin/settings/page.module.css"
]

for fpath in files_to_update:
    full_path = os.path.join(r"c:\\Users\\tawhi\\OneDrive\\Desktop\\ডেভলপমেন্ট প্রজেক্ট\\akabir prokashoni\\akabir-web", fpath)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix the literal \n strings that broke the CSS
        fixed_content = content.replace("\\n\\n/* --- INJECTED PREMIUM STYLES --- */\\n", "\n\n/* --- INJECTED PREMIUM STYLES --- */\n")
        
        with open(full_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f"Fixed {fpath}")
