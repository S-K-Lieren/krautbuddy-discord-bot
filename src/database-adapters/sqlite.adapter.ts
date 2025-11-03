import { DatabaseAdapter } from '../core/abstract-database-adapter';
import { Database, RunResult } from 'sqlite3';
require('dotenv').config();

export class SqlAdapter extends DatabaseAdapter {

    private db!: Database;

    async update<T>(guildID: string, key: string, value: T): Promise<void> {

        this.read<T>(guildID, key)
            .then((readValue: T | undefined) => {
                if (readValue) {

                    this.db.run(`UPDATE main SET value = $value WHERE guildID = $guildID AND key = $key`,
                        {
                            $value: value,
                            $guildID: guildID,
                            $key: key
                        },
                        ((s: RunResult, err: Error | null) => {
                            console.log(s, err);
                        }));
                }
                else {
                    this.create(guildID, key, value);
                }
            })

    }

    async create<T>(guildID: string, key: string, value: T): Promise<void> {
        var stmt = this.db.prepare("INSERT INTO main (guildID, key, value) VALUES($guildID, $key, $value)");
        stmt.run(guildID, key, value);
        stmt.finalize();
    }

    async read<T>(guildID: string, key: string): Promise<T | undefined> {
        return new Promise<T | undefined>((resolve: (value: T | PromiseLike<T> | undefined) => void, _reject: (reason?: any) => void) => {
            this.db.get(`SELECT * FROM main WHERE guildID = "${guildID}" AND key = "${key}"`, (_err, row: any) => {
                if (_err || !row?.value) {
                    resolve(undefined);
                }
                else {
                    resolve(row.value);
                }
            });
        });
    }

    async delete(guildID: string, key: string): Promise<void> {
        this.db.run(`DELETE FROM main WHERE guildID = "${guildID}" AND key = "${key}"`);
    }

    async init(): Promise<void> {

        this.db = new Database(process.env.SQLITE_FILENAME ?? 'db.sqlite3');

        this.db.serialize(() => {
            this.db.run("CREATE TABLE IF NOT EXISTS main (guildID TEXT, key TEXT, value TEXT)");
        });
    }
}
