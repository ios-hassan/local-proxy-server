#!/usr/bin/env python3
"""
MobileDTO 타입별 컴포넌트 추출 스크립트
SampleMobileAPI_1.json, SampleMObileAPI_3.json에서 type별로 JSON을 분리
"""
import json
import os
from collections import defaultdict

def extract_components_with_type(obj, components_by_type, parent_key=None):
    """재귀적으로 객체를 탐색하여 type 필드가 있는 컴포넌트를 추출"""
    if isinstance(obj, dict):
        # type 필드가 있는 경우 해당 타입으로 분류
        if 'type' in obj and isinstance(obj['type'], str):
            type_name = obj['type']
            components_by_type[type_name].append(obj)

        # 자식 객체들도 탐색
        for key, value in obj.items():
            extract_components_with_type(value, components_by_type, key)

    elif isinstance(obj, list):
        for item in obj:
            extract_components_with_type(item, components_by_type, parent_key)

def process_file(file_path, output_dir):
    """JSON 파일을 처리하여 타입별로 분리"""
    print(f"\n처리 중: {file_path}")

    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    components_by_type = defaultdict(list)
    extract_components_with_type(data, components_by_type)

    # 출력 디렉토리 생성
    os.makedirs(output_dir, exist_ok=True)

    # 타입별로 파일 생성
    for type_name, components in sorted(components_by_type.items()):
        # 파일명에 사용할 수 없는 문자 제거
        safe_name = type_name.replace('/', '_').replace('\\', '_')
        output_path = os.path.join(output_dir, f'{safe_name}.json')

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'type': type_name,
                'count': len(components),
                'items': components
            }, f, ensure_ascii=False, indent=2)

        print(f"  - {type_name}: {len(components)}개 → {output_path}")

    return components_by_type

def main():
    base_dir = '/Users/hassan.han/local-proxy-server'

    # 출력 디렉토리
    output_base = os.path.join(base_dir, 'components_by_type')
    os.makedirs(output_base, exist_ok=True)

    files = [
        ('SampleMobileAPI_1.json', 'api1'),
        ('SampleMObileAPI_3.json', 'api3'),
    ]

    all_types = defaultdict(list)

    for filename, subdir in files:
        file_path = os.path.join(base_dir, filename)
        if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
            output_dir = os.path.join(output_base, subdir)
            types = process_file(file_path, output_dir)
            for t, items in types.items():
                all_types[t].extend(items)

    # 전체 통합 파일도 생성
    merged_dir = os.path.join(output_base, 'merged')
    os.makedirs(merged_dir, exist_ok=True)

    print(f"\n통합 파일 생성 중...")
    for type_name, components in sorted(all_types.items()):
        safe_name = type_name.replace('/', '_').replace('\\', '_')
        output_path = os.path.join(merged_dir, f'{safe_name}.json')

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                'type': type_name,
                'count': len(components),
                'items': components
            }, f, ensure_ascii=False, indent=2)

    # 요약 파일 생성
    summary = {
        'total_types': len(all_types),
        'types': {t: len(items) for t, items in sorted(all_types.items(), key=lambda x: -len(x[1]))}
    }

    summary_path = os.path.join(output_base, 'summary.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)

    print(f"\n=== 완료 ===")
    print(f"총 타입 수: {len(all_types)}")
    print(f"출력 디렉토리: {output_base}")
    print(f"요약 파일: {summary_path}")

if __name__ == '__main__':
    main()
