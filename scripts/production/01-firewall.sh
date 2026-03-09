#!/usr/bin/env bash
# Persistent firewall for Locus backend (Oracle Cloud Ubuntu 22.04).
# Run on server: sudo bash scripts/production/01-firewall.sh
# Allows: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Node app; optional if behind Nginx only).

set -e
echo "[firewall] Opening ports 80, 443, 3000..."
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
echo "[firewall] Saving rules (netfilter-persistent)..."
sudo netfilter-persistent save 2>/dev/null || sudo iptables-save | sudo tee /etc/iptables/rules.v4 >/dev/null
echo "[firewall] Done. Ports 80, 443, 3000 allowed."
