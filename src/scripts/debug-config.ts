
import config from '../mikro-orm.config';

console.log('Debugging Config Entities:');
const entities = config.entities as any[];
entities.forEach((e, index) => {
    console.log(`Index ${index}:`, e);
    if (!e) {
        console.error(`ERROR: Entity at index ${index} is UNDEFINED!`);
    }
});
