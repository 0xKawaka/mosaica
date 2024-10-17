use starknet::ContractAddress;
use starknet::class_hash::ClassHash;
use openzeppelin::token::erc20::interface::IERC20Dispatcher;
use ekubo::types::bounds::Bounds;
use ekubo::types::i129::i129;
use ekubo::types::keys::PoolKey;

#[dojo::interface]
trait IMemeArt {
    fn createDrawing(ref world: IWorldDispatcher, name: felt252, symbol: felt252, rdmSalt: felt252);
    fn colorPixels(ref world: IWorldDispatcher, drawingId: u32, x: Array<u16>, y: Array<u16>, r: Array<u8>, g: Array<u8>, b: Array<u8>);
    fn setOwner(ref world: IWorldDispatcher, owner: ContractAddress);
    fn setPixelsRowCount(ref world: IWorldDispatcher, pixelsRowCount: u16);
    fn setPixelsColumnCount(ref world: IWorldDispatcher, pixelsColumnCount: u16);
    fn setRaiseTarget(ref world: IWorldDispatcher, raiseTarget: u256);
    fn setQuoteCurrency(ref world: IWorldDispatcher, quoteCurrency: ContractAddress);
    fn setTokenHash(ref world: IWorldDispatcher, tokenHash: ClassHash);
    fn setTokenTotalSupply(ref world: IWorldDispatcher, tokenTotalSupply: u256);
    // fn setEkuboRegistry(ref world: IWorldDispatcher, ekuboRegistry: ContractAddress);
    // fn setEkuboCore(ref world: IWorldDispatcher, ekuboCore: ContractAddress);
    // fn setEkuboPositions(ref world: IWorldDispatcher, ekuboPositions: ContractAddress);
    fn locked(name: felt252, symbol: felt252, rdmSalt: felt252);
}

#[starknet::interface]
pub trait IERC20NotCamel<TContractState> {
    fn transferFrom(self: @TContractState, from: ContractAddress, to: ContractAddress, value: u256);
}

#[starknet::interface]
trait IEkuboRegistry<ContractState> {
    fn register_token(ref self: ContractState, token: IERC20Dispatcher);
}


#[derive(Drop, Copy, starknet::Store, Serde)]
struct EkuboPoolParameters {
    fee: u128,
    tick_spacing: u128,
    // the sign of the starting tick is positive (false) if quote/token < 1 and negative (true) otherwise
    starting_price: i129,
    // The LP providing bound, upper/lower determined by the address of the LPed tokens
    bound: u128,
}

#[derive(Copy, Drop, Serde)]
struct EkuboLaunchParameters {
    owner: ContractAddress,
    token_address: ContractAddress,
    quote_address: ContractAddress,
    lp_supply: u256,
    pool_params: EkuboPoolParameters
}

#[derive(Serde, Drop, Copy)]
struct LaunchCallback {
    params: EkuboLaunchParameters,
}

#[derive(Copy, Drop, Serde)]
struct EkuboLP {
    owner: ContractAddress,
    quote_address: ContractAddress,
    pool_key: PoolKey,
    bounds: Bounds,
}

#[derive(Serde, Drop, Copy)]
struct WithdrawFeesCallback {
    id: u64,
    liquidity_type: EkuboLP,
    recipient: ContractAddress,
}

#[derive(Serde, Drop, Copy)]
enum CallbackData {
    WithdrawFeesCallback: WithdrawFeesCallback,
    LaunchCallback: LaunchCallback,
}

#[dojo::contract]
mod MemeArt {
    use super::{IMemeArt, IEkuboRegistryDispatcher, IEkuboRegistryDispatcherTrait, IERC20NotCamelDispatcher, IERC20NotCamelDispatcherTrait};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use memeart::models::{Drawing::{Drawing, DrawingsCount}, Pixel::Pixel, Settings::Settings};
    use starknet::syscalls::deploy_syscall;
    use starknet::SyscallResult;
    use starknet::class_hash::ClassHash;
    use openzeppelin::token::erc20::interface::{
        IERC20Dispatcher as OZIERC20Dispatcher, IERC20DispatcherTrait as OZIERC20DispatcherTrait,
    };

    use ekubo::components::clear::{IClearDispatcher, IClearDispatcherTrait};
    use ekubo::components::shared_locker::{call_core_with_callback, consume_callback_data};
    use ekubo::interfaces::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};

    use super::{CallbackData, EkuboLP, LaunchCallback};

    #[abi(embed_v0)]
    impl MemeArtImpl of IMemeArt<ContractState> {
        fn locked(name: felt252, symbol: felt252, rdmSalt: felt252) {
        }
        fn createDrawing(ref world: IWorldDispatcher, name: felt252, symbol: felt252, rdmSalt: felt252) {
            let owner = get_caller_address();
            let drawingsCount = get!(world, 0, (DrawingsCount)).count;
            let settings = get!(world, 0, (Settings));

            let mut calldata: Array<felt252> = array![];

            calldata.append(name);
            calldata.append(symbol);
            calldata.append(settings.tokenTotalSupply.low.into());
            calldata.append(settings.tokenTotalSupply.high.into());
            let result: SyscallResult = deploy_syscall(settings.tokenHash, rdmSalt, calldata.span(), true);
            let (tokenAdrs, _) = result.unwrap();

            // IERC20Dispatcher { contract_address: tokenAdrs }.transfer(settings.ekuboRegistry, 1000000000000000000);
            // IEkuboRegistryDispatcher { contract_address: settings.ekuboRegistry }.register_token(OZIERC20Dispatcher { contract_address: tokenAdrs });

            // let ekubo_launch_params = EkuboLaunchParameters {
            //     owner: 0x0.try_into().unwrap(),
            //     token_address: tokenAdrs,
            //     quote_address: settings.quoteCurrency,
            //     lp_supply: settings.tokenTotalSupply - 1000000000000000000,
            //     pool_params: EkuboPoolParameters {
            //         fee: 0x0,
            //         tick_spacing: 19850,
            //         starting_price: additional_parameters.starting_price,
            //         bound: additional_parameters.bound,
            //     }
            // };

            // let (id, position) = call_core_with_callback::<
            // CallbackData, (u64, EkuboLP)
            // >(settings.ekuboCore, @CallbackData::LaunchCallback(LaunchCallback { params }));

            // let caller = get_caller_address();
            // let ekubo_clear = IClearDispatcher {
            //     contract_address: settings.ekuboPositions
            // };
            // ekubo_clear
            //     .clear_minimum_to_recipient(
            //         IERC20Dispatcher { contract_address: settings.quoteCurrency }, 0, caller
            //     );
            // ekubo_clear
            //     .clear_minimum_to_recipient(
            //         IERC20Dispatcher { contract_address: tokenAdrs }, 0, caller
            //     );

            let pricePerPixel: u256 = settings.raiseTarget / (settings.pixelsRowCount.into() * settings.pixelsColumnCount.into());
            let tokenPerPixel: u256 = (settings.tokenTotalSupply - 1000000000000000000) / (settings.pixelsRowCount.into() * settings.pixelsColumnCount.into()) / 2;

            set!(
                world,
                (
                    Drawing {
                        id: drawingsCount, owner, name, symbol, drawnPixels: 0, pixelsRowCount:settings.pixelsRowCount, pixelsColumnCount: settings.pixelsColumnCount, raiseTarget:settings.raiseTarget, quoteCurrency: settings.quoteCurrency, token: tokenAdrs, pricePerPixel, tokenPerPixel
                    },
                    DrawingsCount { id: 0, count: drawingsCount + 1 }
                )
            );
            emit!(world, (Drawing { id: drawingsCount, owner, name, symbol, drawnPixels: 0, pixelsRowCount:settings.pixelsRowCount, pixelsColumnCount: settings.pixelsColumnCount, raiseTarget:settings.raiseTarget, quoteCurrency: settings.quoteCurrency, token: tokenAdrs, pricePerPixel, tokenPerPixel }));
        }

        fn colorPixels(ref world: IWorldDispatcher, drawingId: u32, x: Array<u16>, y: Array<u16>, r: Array<u8>, g: Array<u8>, b: Array<u8>) {
            assert(x.len() == y.len() && x.len() == r.len() && x.len() == g.len() && x.len() == b.len(), 'Arrays must be same length');
            let drawing = get!(world, drawingId, (Drawing));
            assert(drawing.drawnPixels < drawing.pixelsRowCount.into() * drawing.pixelsColumnCount.into(), 'Drawing completed');
            let settings = get!(world, 0, (Settings));

            let token = OZIERC20Dispatcher { contract_address: drawing.token };
            let quoteToken = IERC20NotCamelDispatcher { contract_address: settings.quoteCurrency };

            let mut i: u32 = 0;
            loop {
                if i == x.len() {
                    break;
                }
                let pixel = get!(world, (drawingId, *x[i], *y[i]), (Pixel));
                assert(pixel.owner.into() == 0x0, 'Pixel already drawn');
                assert(*x[i] < drawing.pixelsColumnCount && *y[i] < drawing.pixelsRowCount, 'Pixel out of bounds');

                set!(
                    world,
                    (
                        Pixel {
                            drawingId, x: *x[i], y: *y[i], owner: get_caller_address(), r: *r[i], g: *g[i], b: *b[i]
                        },
                    )
                );
                i += 1;
            };
            quoteToken.transferFrom(get_caller_address(), get_contract_address(), drawing.pricePerPixel * x.len().into());
            token.transfer(get_caller_address(), drawing.tokenPerPixel * x.len().into());

            set!(
                world,
                (
                    Drawing {
                        id: drawingId, owner: drawing.owner, name: drawing.name, symbol: drawing.symbol, drawnPixels: drawing.drawnPixels + x.len(), pixelsRowCount: drawing.pixelsRowCount, pixelsColumnCount: drawing.pixelsColumnCount, raiseTarget: drawing.raiseTarget, quoteCurrency: drawing.quoteCurrency, token: drawing.token, pricePerPixel: drawing.pricePerPixel, tokenPerPixel: drawing.tokenPerPixel
                    }
                )
            );
        }
        fn setOwner(ref world: IWorldDispatcher, owner: ContractAddress) {
            let settings = get!(world, 0, (Settings));
            assert(settings.owner == get_caller_address(), 'Only owner');
            set!(world, (Settings { owner, ..settings }));
        }
        fn setPixelsRowCount(ref world: IWorldDispatcher, pixelsRowCount: u16) {
            let settings = get!(world, 0, (Settings));
            assert(settings.owner == get_caller_address(), 'Only owner');
            set!(world, (Settings { pixelsRowCount, ..settings }));
        }
        fn setPixelsColumnCount(ref world: IWorldDispatcher, pixelsColumnCount: u16) {
            let settings = get!(world, 0, (Settings));
            assert(settings.owner == get_caller_address(), 'Only owner');
            set!(world, (Settings { pixelsColumnCount, ..settings }));
        }
        fn setRaiseTarget(ref world: IWorldDispatcher, raiseTarget: u256) {
            let settings = get!(world, 0, (Settings));
            assert(settings.owner == get_caller_address(), 'Only owner');
            set!(world, (Settings { raiseTarget, ..settings }));
        }
        fn setQuoteCurrency(ref world: IWorldDispatcher, quoteCurrency: ContractAddress) {
            let settings = get!(world, 0, (Settings));
            assert(settings.owner == get_caller_address(), 'Only owner');
            set!(world, (Settings { quoteCurrency, ..settings }));
        }
        fn setTokenHash(ref world: IWorldDispatcher, tokenHash: ClassHash) {
            let settings = get!(world, 0, (Settings));
            assert(settings.owner == get_caller_address(), 'Only owner');
            set!(world, (Settings { tokenHash, ..settings }));
        }
        fn setTokenTotalSupply(ref world: IWorldDispatcher, tokenTotalSupply: u256) {
            let settings = get!(world, 0, (Settings));
            assert(settings.owner == get_caller_address(), 'Only owner');
            set!(world, (Settings { tokenTotalSupply, ..settings }));
        }
        // fn setEkuboRegistry(ref world: IWorldDispatcher, ekuboRegistry: ContractAddress) {
        //     let settings = get!(world, 0, (Settings));
        //     assert(settings.owner == get_caller_address(), 'Only owner');
        //     set!(world, (Settings { ekuboRegistry, ..settings }));
        // }
        // fn setEkuboCore(ref world: IWorldDispatcher, ekuboCore: ContractAddress) {
        //     let settings = get!(world, 0, (Settings));
        //     assert(settings.owner == get_caller_address(), 'Only owner');
        //     set!(world, (Settings { ekuboCore, ..settings }));
        // }
        // fn setEkuboPositions(ref world: IWorldDispatcher, ekuboPositions: ContractAddress) {
        //     let settings = get!(world, 0, (Settings));
        //     assert(settings.owner == get_caller_address(), 'Only owner');
        //     set!(world, (Settings { ekuboPositions, ..settings }));
        // }
    }
    fn dojo_init(
        ref world: IWorldDispatcher,
    ) {
        set!(world, (Settings { key: 0, owner: get_caller_address(), pixelsRowCount: 30, pixelsColumnCount: 30, raiseTarget: u256 { low: 0x2386F26FC10000, high: 0 }, quoteCurrency: 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7.try_into().unwrap(), tokenHash: 0x02ae62b66f63844803dd4c9f7095aa3e4f9c7bf61a1f759adf63e87f31c2e989.try_into().unwrap(), tokenTotalSupply: u256 { low: 0x204FCE5E3E25026110000000, high: 0}}));   
        // set!(world, (Settings { key: 0, owner: get_caller_address(), pixelsRowCount: 5, pixelsColumnCount: 5, raiseTarget: u256 { low: 0x2386F26FC10000, high: 0 }, quoteCurrency: 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7.try_into().unwrap(), tokenHash: 0x02ae62b66f63844803dd4c9f7095aa3e4f9c7bf61a1f759adf63e87f31c2e989.try_into().unwrap(), tokenTotalSupply: u256 { low: 0x204FCE5E3E25026110000000, high: 0 }, ekuboRegistry: 0x123.try_into().unwrap(), ekuboCore: 0x123.try_into().unwrap(), ekuboPositions: 0x123.try_into().unwrap() }));   
        // set!(world, (Settings { key: 0, owner: get_caller_address(), pixelsRowCount: 30, pixelsColumnCount: 30, raiseTarget: u256 { low: 12917605, high: 0 }, quoteCurrency: 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7.try_into().unwrap(), tokenHash: 0x0171da80d8c2aed43468b02f18842b9dfeaa14e9e2bd6f99f53cf18a17d748df.try_into().unwrap(), tokenTotalSupply: u256 { low: 9070602400912917605, high: 0 } }));   
    }

}