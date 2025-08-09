import { ICustomDataRepository } from '../../../../../application/ports/repositories/ICustomDataRepository';
import { CustomData } from '../../../../../domain/entities/CustomData';
import { MySQLConnection } from '../connection';

export class CustomDataRepository implements ICustomDataRepository {
  private db: MySQLConnection;

  constructor() {
    this.db = MySQLConnection.getInstance();
  }

  public async save(customData: CustomData): Promise<void> {
    const query = `
      INSERT INTO custom_data (id, name, description, category, metadata, tags, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      customData.id,
      customData.name,
      customData.description,
      customData.category,
      JSON.stringify(customData.metadata),
      JSON.stringify(customData.tags),
      customData.userId,
    ];

    await this.db.execute(query, params);
  }

  public async findById(id: string): Promise<CustomData | null> {
    const query = `SELECT * FROM custom_data WHERE id = ?`;
    const rows = await this.db.query(query, [id]) as any[];

    if (rows.length === 0) {
      return null;
    }

    return this.mapRowToCustomData(rows[0]);
  }

  public async findByUserId(userId: string): Promise<CustomData[]> {
    const query = `
      SELECT * FROM custom_data 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.query(query, [userId]) as any[];
    return rows.map(row => this.mapRowToCustomData(row));
  }

  public async findByCategory(category: string): Promise<CustomData[]> {
    const query = `
      SELECT * FROM custom_data 
      WHERE category = ? 
      ORDER BY created_at DESC
    `;
    
    const rows = await this.db.query(query, [category]) as any[];
    return rows.map(row => this.mapRowToCustomData(row));
  }

  public async update(customData: CustomData): Promise<void> {
    const query = `
      UPDATE custom_data 
      SET name = ?, description = ?, category = ?, metadata = ?, tags = ?
      WHERE id = ?
    `;

    const params = [
      customData.name,
      customData.description,
      customData.category,
      JSON.stringify(customData.metadata),
      JSON.stringify(customData.tags),
      customData.id,
    ];

    await this.db.execute(query, params);
  }

  public async delete(id: string): Promise<void> {
    const query = `DELETE FROM custom_data WHERE id = ?`;
    await this.db.execute(query, [id]);
  }

  private mapRowToCustomData(row: any): CustomData {
    return CustomData.create({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      metadata: JSON.parse(row.metadata),
      tags: JSON.parse(row.tags),
      userId: row.user_id,
    });
  }
}