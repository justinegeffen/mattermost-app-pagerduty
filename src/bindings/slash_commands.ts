import {AppBinding, AppsState} from '../types';
import {
    connectAccountBinding,
    getConfigureBinding,
    getHelpBinding, 
    listBinding, 
    subscriptionBinding,
    getIncidentsBinding
} from './bindings';
import {
    AppBindingLocations,
    Commands,
    CommandTrigger,
    PagerDutyIcon
} from '../constant';

const newCommandBindings = (bindings: AppBinding[]): AppsState => {
    const commands: string[] = [
        Commands.HELP,
        Commands.CONFIGURE,
        Commands.ACCOUNT,
        Commands.SUBSCRIPTION,
        Commands.INCIDENT,
        Commands.LIST
    ];

    return {
        location: AppBindingLocations.COMMAND,
        bindings: [
            {
                icon: PagerDutyIcon,
                label: CommandTrigger,
                hint: `[${commands.join(' | ')}]`,
                description: 'Manage PagerDuty',
                bindings,
            },
        ],
    };
};

export const getCommandBindings = (): AppsState => {
    const bindings: AppBinding[] = [];

    bindings.push(getHelpBinding());
    bindings.push(getConfigureBinding());
    bindings.push(connectAccountBinding());
    bindings.push(subscriptionBinding())
    bindings.push(listBinding());
    bindings.push(getIncidentsBinding());
    bindings.push(getConfigureBinding());
    return newCommandBindings(bindings);
};

