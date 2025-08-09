export class CustomData {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string,
    public readonly category: string,
    public readonly metadata: Record<string, unknown>,
    public readonly tags: string[],
    public readonly userId: string,
    public readonly createdAt: string
  ) {}

  public static create(data: {
    id: string;
    name: string;
    description: string;
    category: string;
    metadata?: Record<string, unknown>;
    tags?: string[];
    userId: string;
  }): CustomData {
    return new CustomData(
      data.id,
      data.name,
      data.description,
      data.category,
      data.metadata || {},
      data.tags || [],
      data.userId,
      new Date().toISOString()
    );
  }

  public hasTag(tag: string): boolean {
    return this.tags.includes(tag);
  }

  public addTag(tag: string): CustomData {
    if (!this.hasTag(tag)) {
      return new CustomData(
        this.id,
        this.name,
        this.description,
        this.category,
        this.metadata,
        [...this.tags, tag],
        this.userId,
        this.createdAt
      );
    }
    return this;
  }

  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      category: this.category,
      metadata: this.metadata,
      tags: this.tags,
      userId: this.userId,
      createdAt: this.createdAt,
    };
  }
}