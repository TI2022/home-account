export class Category {
  private static readonly VALID_CATEGORIES = [
    '食費',
    '交通費',
    '住居費',
    '光熱費',
    '通信費',
    '医療費',
    '教育費',
    '娯楽費',
    '衣類費',
    'その他'
  ] as const;

  constructor(private readonly value: string) {
    if (!Category.isValid(value)) {
      throw new Error(`Invalid category: ${value}`);
    }
  }

  static create(value: string): Category {
    return new Category(value);
  }

  static isValid(value: string): boolean {
    return Category.VALID_CATEGORIES.includes(value as typeof Category.VALID_CATEGORIES[number]);
  }

  static getAllCategories(): readonly string[] {
    return Category.VALID_CATEGORIES;
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Category): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
} 