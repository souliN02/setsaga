// Hand-written declaration for the drizzle-kit-generated migrations.js
// (plain JS, and tsconfig has no allowJs). Shape must stay structurally
// compatible with the `migrations` parameter of drizzle-orm's useMigrations.
declare const migrations: {
  journal: {
    entries: {
      idx: number;
      when: number;
      tag: string;
      breakpoints: boolean;
    }[];
  };
  migrations: Record<string, string>;
};

export default migrations;
