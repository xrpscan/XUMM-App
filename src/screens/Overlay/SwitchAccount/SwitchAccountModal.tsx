/**
 * Switch Account Overlay
 */

import { Results } from 'realm';
import { find } from 'lodash';

import React, { Component } from 'react';
import { Animated, View, Text, TouchableWithoutFeedback, TouchableOpacity, Platform, ScrollView } from 'react-native';

import Interactable from 'react-native-interactable';
import LinearGradient from 'react-native-linear-gradient';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';
import { AccessLevels } from '@store/types';

import { Images } from '@common/helpers/images';
import { getNavigationBarHeight } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button, Icon } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppSizes, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    accounts: Results<AccountSchema>;
    contentHeight: number;
    paddingBottom: number;
}

/* Component ==================================================================== */
class SwitchAccountOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SwitchAccount;

    panel: any;
    deltaY: Animated.Value;
    onDismiss: () => void;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            accounts: undefined,
            contentHeight: 0,
            paddingBottom: 0,
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.onDismiss = () => {};
    }

    componentDidMount() {
        const accounts = AccountRepository.getAccounts();

        let contentHeight = accounts.length * AppSizes.scale(60) + 160 + getNavigationBarHeight();

        let paddingBottom = 0;

        if (contentHeight > AppSizes.screen.height - 160) {
            contentHeight = AppSizes.screen.height - 160;
            paddingBottom = AppSizes.scale(60);
        }

        if (contentHeight < 300) {
            contentHeight = 300;
        }

        this.setState(
            {
                accounts,
                contentHeight,
                paddingBottom,
            },
            () => {
                this.slideUp();
            },
        );
    }

    slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 10);
    };

    slideDown = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        }, 10);
    };

    onSnap = async (event: any) => {
        const { index } = event.nativeEvent;

        if (index === 0) {
            Navigator.dismissOverlay();
        }
    };

    onAddPressed = () => {
        if (Platform.OS === 'ios') {
            this.slideDown();
            setTimeout(() => {
                Navigator.push(AppScreens.Account.Add);
            }, 300);
        } else {
            Navigator.dismissOverlay();
            setTimeout(() => {
                Navigator.push(AppScreens.Account.Add);
            }, 100);
        }
    };

    changeDefaultAccount = (address: string) => {
        AccountRepository.setDefaultAccount(address);
        this.slideDown();
    };

    isRegularKey = (account: AccountSchema) => {
        const { accounts } = this.state;

        const found = find(accounts, { regularKey: account.address });

        if (found) {
            return found.label;
        }

        return false;
    };

    renderRow = (account: AccountSchema) => {
        // default full access
        let accessLevelLabel = Localize.t('account.fullAccess');
        let accessLevelIcon = 'IconCornerLeftUp' as Extract<keyof typeof Images, string>;

        if (account.accessLevel === AccessLevels.Readonly) {
            accessLevelLabel = Localize.t('account.readOnly');
            accessLevelIcon = 'IconLock';
        }

        const regularKeyFor = this.isRegularKey(account);
        if (regularKeyFor) {
            accessLevelLabel = `${Localize.t('account.regularKeyFor')} (${regularKeyFor})`;
            accessLevelIcon = 'IconKey';
        }

        if (account.default) {
            return (
                <View
                    key={account.address}
                    style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow, styles.accountRowSelected]}
                >
                    <View style={[AppStyles.row, AppStyles.flex3, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={[styles.accountLabel]}>{account.label}</Text>
                            <View style={[styles.accessLevelContainer]}>
                                <Icon size={13} name={accessLevelIcon} style={AppStyles.imgColorBlack} />
                                <Text style={[styles.accessLevelLabel, AppStyles.colorBlack]}>{accessLevelLabel}</Text>
                            </View>
                        </View>
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <View style={[styles.radioCircleSelected, AppStyles.rightSelf]} />
                    </View>
                </View>
            );
        }

        return (
            <LinearGradient
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                colors={[AppColors.light, AppColors.white]}
                style={[AppStyles.row, AppStyles.centerAligned, styles.accountRow]}
            >
                <TouchableOpacity
                    key={account.address}
                    style={[AppStyles.row, AppStyles.centerAligned]}
                    onPress={() => {
                        this.changeDefaultAccount(account.address);
                    }}
                    activeOpacity={0.9}
                >
                    <View style={[AppStyles.flex3]}>
                        <Text style={[styles.accountLabel]}>{account.label}</Text>
                        <View style={[styles.accessLevelContainer]}>
                            <Icon size={13} name={accessLevelIcon} style={AppStyles.imgColorGreyDark} />
                            <Text style={[styles.accessLevelLabel]}>{accessLevelLabel}</Text>
                        </View>
                    </View>
                    <View style={[AppStyles.flex1]}>
                        <View style={[styles.radioCircle, AppStyles.rightSelf]} />
                    </View>
                </TouchableOpacity>
            </LinearGradient>
        );
    };

    renderContent = () => {
        const { accounts } = this.state;

        if (accounts.length === 0) {
            return (
                <View style={[AppStyles.centerContent, AppStyles.centerAligned, AppStyles.paddingTop]}>
                    <Text style={[AppStyles.p, AppStyles.strong]}>{Localize.t('account.noAccountYet')}</Text>
                </View>
            );
        }

        return accounts.map((account) => {
            return this.renderRow(account);
        });
    };

    render() {
        const { accounts, contentHeight, paddingBottom } = this.state;

        if (!accounts) return null;

        return (
            <View style={AppStyles.flex1}>
                <TouchableWithoutFeedback
                    onPress={() => {
                        this.slideDown();
                    }}
                >
                    <Animated.View
                        style={[
                            AppStyles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [1, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onSnap={this.onSnap}
                    verticalOnly
                    snapPoints={[{ y: AppSizes.screen.height + 3 }, { y: AppSizes.screen.height - contentHeight }]}
                    boundaries={{ top: AppSizes.screen.height - (contentHeight + 50) }}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                >
                    <View style={[styles.visibleContent, { height: contentHeight + 50 }]}>
                        <View style={AppStyles.panelHeader}>
                            <View style={AppStyles.panelHandle} />
                        </View>

                        <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                            <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                                <Text style={[AppStyles.h5]}>{Localize.t('account.myAccounts')}</Text>
                            </View>
                            <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                                <Button
                                    label={Localize.t('home.addAccount')}
                                    icon="IconPlus"
                                    iconStyle={[AppStyles.imgColorBlue]}
                                    roundedSmall
                                    light
                                    isDisabled={false}
                                    onPress={this.onAddPressed}
                                />
                            </View>
                        </View>
                        <ScrollView contentContainerStyle={{ paddingBottom }}>{this.renderContent()}</ScrollView>
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SwitchAccountOverlay;
