import os
import re
import json

def parse_novel():
    with open('《黑暗公爵府的勇者开局》完整版全本(2).md', 'r', encoding='utf-8') as f:
        text = f.read()

    headers = list(re.finditer(r'^(#{1,3}\s+(?:第[一二三四五六七八九十]+[卷章]|番外·后日谈).*)$', text, re.MULTILINE))

    volumes = []
    chapters = []
    current_vol = {'id': 1, 'title': '第一卷：深渊与襁褓——公爵府的阴影与母子同盟'}
    volumes.append(current_vol)

    for i, h in enumerate(headers):
        line = h.group(1).strip()
        pos = h.start()
        next_pos = headers[i+1].start() if i+1 < len(headers) else len(text)
        content = text[h.end():next_pos].strip()

        if '卷：' in line:
            vol_title = re.sub(r'^#+\s*', '', line)
            current_vol = {'id': len(volumes) + 1, 'title': vol_title}
            volumes.append(current_vol)
        else:
            ch_title = re.sub(r'^#+\s*', '', line)
            
            # If it's the epilogue, ensure it has a dedicated volume or special tag
            vol_id = current_vol['id']
            vol_title = current_vol['title']
            if '番外' in ch_title:
                vol_id = 6
                vol_title = '特别篇：官方番外·后日谈'
                if not any(v['id'] == 6 for v in volumes):
                    volumes.append({'id': 6, 'title': vol_title})

            # clean up markdown paragraphs
            raw_paragraphs = [p.strip() for p in content.split('\n\n') if p.strip()]
            
            # word count roughly in Chinese characters
            words = len(re.findall(r'[\u4e00-\u9fa5a-zA-Z0-9]', content))

            # brief summary from the first 2 paragraphs
            summary = ""
            for p in raw_paragraphs:
                cleaned = re.sub(r'[#*>`\-_]', '', p).strip()
                if len(cleaned) > 20:
                    summary = cleaned[:90] + "..."
                    break

            chapters.append({
                'id': len(chapters) + 1,
                'volumeId': vol_id,
                'volumeTitle': vol_title,
                'title': ch_title,
                'summary': summary,
                'wordCount': words,
                'content': content,
                'paragraphs': raw_paragraphs
            })

    return {'volumes': volumes, 'chapters': chapters}

def main():
    os.makedirs('js', exist_ok=True)
    os.makedirs('css', exist_ok=True)
    
    novel_data = parse_novel()
    print(f"Parsed {len(novel_data['volumes'])} volumes, {len(novel_data['chapters'])} chapters.")

    novel_js_content = "window.NOVEL_DATA = " + json.dumps(novel_data, ensure_ascii=False, indent=2) + ";\n"
    with open('js/novelData.js', 'w', encoding='utf-8') as f:
        f.write(novel_js_content)
    print("Saved js/novelData.js successfully!")

if __name__ == '__main__':
    main()
