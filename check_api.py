import urllib.request, json
with urllib.request.urlopen('https://web-production-bd153.up.railway.app/api/books/') as res:
    data = json.loads(res.read().decode('utf-8'))
    with open('api_output.txt', 'w', encoding='utf-8') as f:
        for b in data['results'][:5]:
            f.write(f"Title: {b['title']}\\nPrice: {b['price']}\\nOriginal: {b['original_price']}\\n\\n")
