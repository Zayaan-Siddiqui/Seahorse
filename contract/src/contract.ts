// Find all our documentation at https://docs.near.org
import { NearBindgen, near, call, view, initialize, LookupMap, Vector } from 'near-sdk-js';

type Provider = {
    id: string;
    name: string;
    valueScore: number;
    walletAddress: string;
};

type DataItem = {
    id: string;
    content: string;
};

@NearBindgen({})
class DataProviderContract {
    providers: LookupMap<Provider>;
    providerIds: Vector<string>;
    providerData: LookupMap<DataItem[]>;

    constructor() {
        this.providers = new LookupMap<Provider>('providers_v1');
        this.providerIds = new Vector<string>('provider_ids_v1');
        this.providerData = new LookupMap<DataItem[]>('provider_data_v1');
    }

    @initialize({})
    init(): void {
        near.log("Initializing contract");
        this.providers = new LookupMap<Provider>('providers_v1');
        this.providerIds = new Vector<string>('provider_ids_v1');
        this.providerData = new LookupMap<DataItem[]>('provider_data_v1');
    }

    @call({})
    add_provider({ id, name, valueScore, walletAddress }: { id: string; name: string; valueScore: number; walletAddress: string }): void {
        near.log(`Adding provider: ${id}`);
        
        if (valueScore < 1 || valueScore > 100) {
            throw new Error("Value score must be between 1 and 100");
        }
        
        const provider: Provider = { id, name, valueScore, walletAddress };
        this.providers.set(id, provider);
        this.providerIds.push(id);
        this.providerData.set(id, []);
        
        near.log(`Successfully added provider ${id}`);
    }

    @call({})
    update_provider_value({ id, valueScore }: { id: string; valueScore: number }): void {
        near.log(`Updating provider ${id} value score to ${valueScore}`);

        if (valueScore < 1 || valueScore > 100) {
            near.log(`Invalid value score: ${valueScore}`);
            throw new Error("Value score must be between 1 and 100");
        }

        const provider = this.providers.get(id);
        if (!provider) {
            near.log(`Provider ${id} not found`);
            throw new Error("Provider not found");
        }
        
        provider.valueScore = valueScore;
        this.providers.set(id, provider);
        near.log(`Successfully updated provider ${id} value score`);
    }

    @call({})
    add_provider_data({ providerId, data }: { providerId: string; data: DataItem[] }): void {
        near.log(`Starting add_provider_data for provider: ${providerId}`);
        near.log(`Number of items to add: ${data.length}`);
        
        // initialize empty array if no existing data
        let existingData = this.providerData.get(providerId) || [];
        
        // ensure we're working with arrays
        const currentData = Array.isArray(existingData) ? existingData : [];
        const newData = Array.isArray(data) ? data : [];
        
        // combine the arrays
        const combinedData = [...currentData, ...newData];
        this.providerData.set(providerId, combinedData);
        
        near.log(`Successfully added ${data.length} items for provider ${providerId}`);
    }

    @call({})
    remove_provider_data({ providerId, dataIds }: { providerId: string; dataIds: string[] }): void {
        near.log(`Starting remove_provider_data for provider: ${providerId}`);
        near.log(`Items to remove: ${dataIds.join(', ')}`);

        const existingData = this.providerData.get(providerId);
        if (!existingData) {
            near.log(`Provider ${providerId} not found`);
            throw new Error("Provider not found");
        }

        const newData = existingData.filter(item => !dataIds.includes(item.id));
        near.log(`Items remaining after filter: ${newData.length}`);

        this.providerData.set(providerId, newData);
        near.log(`Successfully removed specified items for provider ${providerId}`);
    }

    @call({})
    process_query({ queryResults }: { queryResults: { providerId: string; relevancyScore: number }[] }): void {
        near.log(`Starting process_query with ${queryResults.length} results`);
        const payouts: { [key: string]: bigint } = {};

        for (const result of queryResults) {
            near.log(`Processing result for provider: ${result.providerId}`);
            near.log(`Relevancy score: ${result.relevancyScore}`);
            
            const provider = this.providers.get(result.providerId);
            if (!provider) {
            near.log(`Provider ${result.providerId} not found, skipping`);
            continue;
            }
            
            near.log(`Provider ${provider.id} found, value score: ${provider.valueScore}`);
            const payout = BigInt(provider.valueScore) * BigInt(result.relevancyScore) * BigInt(1e17);
            near.log(`Calculated payout: ${payout} yoctoNEAR`);
            
            payouts[provider.walletAddress] = (payouts[provider.walletAddress] || BigInt(0)) + payout;
            near.log(`Updated total payout for ${provider.walletAddress}: ${payouts[provider.walletAddress]} yoctoNEAR`);
        }

        for (const [walletAddress, payout] of Object.entries(payouts)) {
            near.log(`Processing payout for wallet: ${walletAddress}`);
            near.log(`Attempting to transfer ${payout} yoctoNEAR to ${walletAddress}`);
            
            const promiseIndex = near.promiseBatchCreate(walletAddress);
            near.promiseBatchActionTransfer(promiseIndex, payout);
            near.log(`Transfer initiated for ${walletAddress}`);
        }
    
        near.log('Query processing completed');
    }

    @view({})
    get_provider({ id }: { id: string }): Provider | null {
        near.log(`Getting provider info for: ${id}`);
        const provider = this.providers.get(id);

        if (provider) {
            near.log(`Found provider: ${provider.name}`);
        } else {
            near.log(`Provider ${id} not found`);
        }

        return provider;
    }

    @view({})
    get_provider_data({ providerId }: { providerId: string }): DataItem[] {
        near.log(`Getting data for provider: ${providerId}`);
        const data = this.providerData.get(providerId);
        
        if (!data) {
            near.log(`Provider ${providerId} not found or has no data`);
            return [];
        }

        // ensure we're returning a plain array
        return Array.isArray(data) ? data : [];
    }

    @view({})
    get_all_providers(): Provider[] {
        const providers: Provider[] = [];
        const ids = this.providerIds.toArray();
        
        for (const id of ids) {
            const provider = this.providers.get(id);
            if (provider) {
                providers.push(provider);
            }
        }
        
        return providers;
    }

    @call({})
    remove_provider({ id }: { id: string }): void {
        near.log(`Starting remove_provider for: ${id}`);
        
        // Remove the provider
        this.providers.remove(id);
        
        // Remove from providerIds vector
        const ids = this.providerIds.toArray();
        const filteredIds = ids.filter(pid => pid !== id);
        this.providerIds.clear();
        for (const pid of filteredIds) {
            this.providerIds.push(pid);
        }
        
        // Remove all associated data
        this.providerData.remove(id);
        
        near.log(`Successfully removed provider ${id} and its data`);
    }
}