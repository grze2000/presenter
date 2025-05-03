import sqlite3
import re

with open('src/data/baza.slb', encoding='utf-8') as f:
    content = f.read()

db = sqlite3.connect('src/data/database.db')
cur = db.cursor()

# Create tables
cur.executescript("""
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS songs;
DROP TABLE IF EXISTS verses;

CREATE TABLE categories (
    code TEXT PRIMARY KEY,
    name TEXT
);

CREATE TABLE songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category_code TEXT
);

CREATE TABLE verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER,
    number INTEGER,
    text TEXT
);
""")

# Extract categories
categories_block = re.search(r"\[kategorieBegin\](.*?)\[kategorieEnd\]", content, re.S).group(1)
for line in categories_block.strip().splitlines():
    name, code = line.strip().split("|")
    cur.execute("INSERT INTO categories (code, name) VALUES (?, ?)", (code, name))

# Extract songs
for song_block in re.findall(r"\[tytulBegin\](.*?)\[tytulEnd\]", content, re.S):
    category_code = re.search(r"%k:(.*?)\n", song_block).group(1).strip()
    title = re.search(r"%t:(.*?)\n", song_block).group(1).strip()
    cur.execute("INSERT INTO songs (title, category_code) VALUES (?, ?)", (title, category_code))
    song_id = cur.lastrowid

    verses = re.findall(r"%w:\n(.*?)(?=\n%w:|\Z)", song_block, re.S)
    for i, v in enumerate(verses):
        text = v.strip()
        cur.execute("INSERT INTO verses (song_id, number, text) VALUES (?, ?, ?)", (song_id, i + 1, text))

db.commit()
db.close()
print("✅ Baza danych została zbudowana w src/data/database.db")
