import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, SectionList, Text, TouchableOpacity } from 'react-native';
import { fetchTransactionHistory } from '../../utils/networking/API';
import { sortTransactionsByDate } from '../../utils/transactions/TransactionUtils';
import Colors from '../../utils/styling/Colors';
import useUserAccountState from '../../utils/hooks/UseUserAccountState';
import Navbar from '../../components/Navbar';
import WalletDetailsSection from './WalletDetailsSection';
import TransactionHistorySection from './TransactionHistorySection';
import BottomSheet from 'reanimated-bottom-sheet';
import { SWYM_DEPOSIT_ADDRESS } from '../../utils/constants/Swym';
import DepositSheet from './DepositSheet';

export const SectionKind = Object.freeze({
  WALLET_BALANCE: 'WALLET_BALANCE',
  TRANSACTION_HISTORY: 'TRANSACTION_HISTORY',
});

function sectionListItemKeyExtractor(item, index) {
  return index;
}

const WalletScreen = () => {
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [isFetchingTransactionHistory, setIsFetchingTransactionHistory] = useState(false);
  const [hasTransactionHistoryFetchError, setHasTransactionHistoryFetchError] = useState(false);

  const { userAccount, isFetchingUserAccount, hasUserAccountFetchError } = useUserAccountState();

  const depositSheetRef = useRef(null);

  const sortedTransactions = useMemo(() => {
    return sortTransactionsByDate(transactionHistory);
  }, [transactionHistory]);

  const accountBalance = useMemo(() => {
    return userAccount === null ? 0 : userAccount.balance;
  }, [userAccount]);

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  async function loadTransactionHistory() {
    setIsFetchingTransactionHistory(true);

    try {
      const transactionHistory = await fetchTransactionHistory();

      setTransactionHistory(transactionHistory);
      setHasTransactionHistoryFetchError(false);
    } catch (error) {
      setHasTransactionHistoryFetchError(true);
    } finally {
      setIsFetchingTransactionHistory(false);
    }
  }

  function renderDepositSheet() {
    // TODO: I'm thinking we'll need to fetch this dynamically.
    const address = SWYM_DEPOSIT_ADDRESS;

    return (
      <DepositSheet
        address={address}
        onShareSelected={shareDepositAddress}
        onCopySelected={copyDepositAddress}
        onClose={hideDepositSheet}
      />
    );
  }

  function showDepositSheet() {
    depositSheetRef.current.snapTo(0);
  }

  function hideDepositSheet() {
    depositSheetRef.current.snapTo(1);
  }

  function shareDepositAddress() {
    hideDepositSheet();
  }

  function copyDepositAddress() {
    hideDepositSheet();
  }

  function performWithdrawal() {}

  return (
    <View style={styles.rootViewContainer}>
      <SectionList
        contentContainerStyle={styles.contentContainer}
        sections={[
          {
            kind: SectionKind.WALLET_BALANCE,
            data: [accountBalance],
            renderItem: () => {
              return (
                <View style={[styles.cardContainer, styles.viewSectionContainer]}>
                  <WalletDetailsSection
                    balance={accountBalance}
                    isFetching={isFetchingUserAccount}
                    onDepositSelected={showDepositSheet}
                    onSendSelected={performWithdrawal}
                  />
                </View>
              );
            },
          },
          {
            kind: SectionKind.TRANSACTION_HISTORY,
            data: [transactionHistory],
            renderItem: () => {
              return (
                <View style={[styles.cardContainer, styles.viewSectionContainer]}>
                  <TransactionHistorySection
                    transactions={sortedTransactions}
                    isFetching={isFetchingTransactionHistory}
                  />
                </View>
              );
            },
          },
        ]}
        keyExtractor={sectionListItemKeyExtractor}
        stickySectionHeadersEnabled={false}
      />
      <BottomSheet
        ref={depositSheetRef}
        snapPoints={[450, 0]}
        initialSnap={1}
        borderRadius={16}
        renderContent={renderDepositSheet}
        enabledContentTapInteraction={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  rootViewContainer: {
    alignItems: 'center',
    backgroundColor: Colors.blue,
    flex: 1,
    justifyContent: 'center',
  },

  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
  },

  cardContainer: {
    maxWidth: '100%',
    minWidth: '100%',
  },

  viewSectionContainer: {
    marginBottom: 20,
  },
});

WalletScreen.propTypes = {};

WalletScreen.defaultProps = {};

WalletScreen.navigationOptions = () => {
  return {
    header: () => {
      return <Navbar title="Wallet" />;
    },
  };
};

export default WalletScreen;
