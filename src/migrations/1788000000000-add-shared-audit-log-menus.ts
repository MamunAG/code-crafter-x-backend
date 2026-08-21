import { MigrationInterface, QueryRunner } from 'typeorm';

const AUDIT_MENUS = [
  {
    moduleKey: 'merchandising',
    menuName: 'Merchandising Audit Log',
    menuPath: '/merchandising/audit-log',
    description: 'All retained merchandising activity for the organization',
    displayOrder: 50,
  },
  {
    moduleKey: 'iam',
    menuName: 'IAM Audit Log',
    menuPath: '/iam/security/audit-logs/events',
    description:
      'All retained identity and access activity for the organization',
    displayOrder: 50,
  },
] as const;

export class AddSharedAuditLogMenus1788000000000 implements MigrationInterface {
  name = 'AddSharedAuditLogMenus1788000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const menu of AUDIT_MENUS) {
      await queryRunner.query(
        `
          INSERT INTO "menu" ("menu_name", "menu_path", "module_id", "description", "display_order", "is_active")
          SELECT
            $1::varchar,
            $2::varchar,
            module.id,
            $3::text,
            $4::integer,
            true
          FROM (
            SELECT "id"
            FROM "module_entry"
            WHERE (
              LOWER(TRIM("module_key")) = $5::text
              OR LOWER(TRIM("module_name")) = $5::text
            )
              AND "deleted_at" IS NULL
            ORDER BY "display_order" ASC
            LIMIT 1
          ) module
          WHERE NOT EXISTS (
              SELECT 1 FROM "menu" existing
              WHERE existing."menu_name" = $1::varchar
                AND existing."module_id" = module.id
                AND existing."deleted_at" IS NULL
            )
        `,
        [
          menu.menuName,
          menu.menuPath,
          menu.description,
          menu.displayOrder,
          menu.moduleKey,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const menu of [...AUDIT_MENUS].reverse()) {
      await queryRunner.query(
        `
          DELETE FROM "menu"
          WHERE "menu_name" = $1::varchar
            AND "module_id" IN (
              SELECT "id" FROM "module_entry"
              WHERE LOWER(TRIM("module_key")) = $2::text
                 OR LOWER(TRIM("module_name")) = $2::text
            )
        `,
        [menu.menuName, menu.moduleKey],
      );
    }
  }
}
