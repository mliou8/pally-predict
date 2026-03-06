import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import Colors from '../constants/colors';

export default function LoginScreen() {
  const { login, isLoading } = useAuth();
  const { connect, isConnecting, isConnected, publicKey } = useWallet();

  return (
    <LinearGradient
      colors={[Colors.dark.background, '#1A1A1E']}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoEmoji}>🎯</Text>
          </View>
          <Text style={styles.title}>Pally Predict</Text>
          <Text style={styles.subtitle}>Predict. Compete. Win.</Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(255, 107, 53, 0.15)' }]}>
              <Ionicons name="flash" size={20} color={Colors.dark.accent} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Daily Predictions</Text>
              <Text style={styles.featureDesc}>New questions every day</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(34, 197, 94, 0.15)' }]}>
              <Ionicons name="trophy" size={20} color="#22C55E" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Earn Points</Text>
              <Text style={styles.featureDesc}>Win Wager Points for correct predictions</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="wallet" size={20} color="#3B82F6" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Solana Wallet</Text>
              <Text style={styles.featureDesc}>Connect your wallet for rewards</Text>
            </View>
          </View>
        </View>

        {/* Login Buttons */}
        <View style={styles.buttons}>
          {/* Twitter Login */}
          <TouchableOpacity
            style={styles.twitterButton}
            onPress={login}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="logo-twitter" size={24} color="#FFFFFF" />
                <Text style={styles.buttonText}>Sign in with Twitter</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Wallet Connect */}
          <TouchableOpacity
            style={[styles.walletButton, isConnected && styles.walletConnected]}
            onPress={connect}
            disabled={isConnecting || isConnected}
          >
            {isConnecting ? (
              <ActivityIndicator color={Colors.dark.accent} />
            ) : isConnected ? (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                <Text style={styles.walletButtonText}>
                  {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="wallet-outline" size={24} color={Colors.dark.accent} />
                <Text style={styles.walletButtonText}>Connect Solana Wallet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.dark.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.dark.textSecondary,
  },
  features: {
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 14,
    color: Colors.dark.textSecondary,
  },
  buttons: {
    gap: 12,
  },
  twitterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1DA1F2',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  walletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.surface,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    gap: 12,
  },
  walletConnected: {
    borderColor: '#22C55E',
  },
  walletButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    fontSize: 12,
    color: Colors.dark.textMuted,
    lineHeight: 18,
  },
});
