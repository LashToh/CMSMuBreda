import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaBoxOpen,
  FaChevronDown,
  FaClock,
  FaCoins,
  FaExchangeAlt,
  FaHeart,
  FaHistory,
  FaList,
  FaSearch,
  FaShieldAlt,
  FaStore,
  FaSyncAlt,
  FaTh,
  FaTimes,
  FaWallet,
} from 'react-icons/fa';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import {
  buyMarketListing,
  cancelMarketListing,
  decideMarketOffer,
  fetchMarketHistory,
  fetchMarketInventory,
  fetchMarketListings,
  fetchMarketOffers,
  fetchMarketStatus,
  fetchMarketWallet,
  fetchMyMarket,
  makeMarketOffer,
  publishMarketListing,
  withdrawMarketBalance,
} from '../services/api';
import './MarketPage.scss';

const SAMPLE_LISTINGS = [
  { id: 1, name: 'Bone Blade', category: 'weapon', className: 'Dark Knight', level: '+13', options: 'Excellent · Skill · Luck', price: 85000000, currency: 'Zen', seller: 'Ares', age: 'hace 4 min', mark: '13', tone: 'steel', qualities: ['excellent', 'skill', 'luck'] },
  { id: 2, name: 'Great Dragon Armor', category: 'armor', className: 'Dark Knight', level: '+13', options: 'Excellent · Luck · 4 opciones', price: 320, currency: 'WCoinC', seller: 'Kaiser', age: 'hace 12 min', mark: 'GD', tone: 'crimson', qualities: ['excellent', 'luck'] },
  { id: 3, name: 'Wings of Soul', category: 'wings', className: 'Dark Wizard', level: '+11', options: 'Luck · Ignore · 7%', price: 14, currency: 'Jewel', jewelCosts: [{ name: 'Bless', amount: 8 }, { name: 'Soul', amount: 6 }], seller: 'Lunaria', age: 'hace 20 min', mark: 'III', tone: 'azure', qualities: ['socket', 'luck'], offerCurrencies: ['wcoinc', 'jewels'] },
  { id: 4, name: 'Excellent Ring of Ice', category: 'accessory', className: 'Todos', level: '+0', options: 'Excellent · 2 opciones', price: 12500000, currency: 'Zen', seller: 'Maverick', age: 'hace 31 min', mark: 'R', tone: 'violet', qualities: ['excellent'] },
  { id: 5, name: 'Divine Staff of Archangel', category: 'weapon', className: 'Dark Wizard', level: '+13', options: 'Excellent · Skill · Luck', price: 240, currency: 'WCoinC', seller: 'Arcanum', age: 'hace 48 min', mark: '+13', tone: 'gold', qualities: ['excellent', 'skill', 'luck'] },
  { id: 6, name: 'Dark Soul Gloves', category: 'gloves', className: 'Dark Wizard', level: '+12', options: 'Excellent · Luck · 3 opciones', price: 9500000, currency: 'Zen', seller: 'Nox', age: 'hace 1 h', mark: '+12', tone: 'violet', qualities: ['excellent', 'ancient'] },
  { id: 7, name: 'Dinorant', category: 'pet', className: 'Todos', level: '+0', options: 'Skill · Intercambiable', price: 6, currency: 'Jewel', seller: 'Ragnar', age: 'hace 2 h', mark: 'D', tone: 'amber' },
  { id: 8, name: 'Guardian Angel', category: 'pet', className: 'Todos', level: '+0', options: 'Pet · 255 de vida', price: 4200000, currency: 'Zen', seller: 'Atenea', age: 'hace 2 h', mark: 'GA', tone: 'azure' },
  { id: 9, name: 'Dark Phoenix Shield', category: 'armor', className: 'Dark Knight', level: '+13', options: 'Excellent · Luck · 4 opciones', price: 175, currency: 'WCoinC', seller: 'Kronos', age: 'hace 3 h', mark: '+13', tone: 'crimson', qualities: ['excellent'] },
  { id: 10, name: 'Jewel of Chaos', category: 'jewel', className: 'Todos', level: 'x30', options: 'Paquete de joyas', price: 3, currency: 'WCoinC', seller: 'Maga', age: 'hace 3 h', mark: '30', tone: 'azure' },
  { id: 11, name: 'Scale Shield', category: 'armor', className: 'Dark Knight', level: '+ luck', options: 'Excellent · Reflect · 4%', price: 7800000, currency: 'Zen', seller: 'Berserk', age: 'hace 4 h', mark: 'S', tone: 'steel', qualities: ['excellent'] },
  { id: 12, name: 'Wings of Heaven', category: 'wings', className: 'Fairy Elf', level: '+13', options: 'Luck · Ignore · 7%', price: 185, currency: 'WCoinC', seller: 'Sylph', age: 'hace 5 h', mark: 'III', tone: 'azure', qualities: ['socket'] },
];

const CATEGORY_ICONS = {
  all: FaTh,
  bladeSword: '/assets/market-icons/blades-swords.svg',
  bowCrossbow: '/assets/market-icons/bows-crossbows.svg',
  staffStick: '/assets/market-icons/staves-sticks.svg',
  scepter: '/assets/market-icons/scepters.png',
  shieldBook: '/assets/market-icons/shields-books.svg',
  helm: '/assets/market-icons/helms.svg',
  armor: '/assets/market-icons/armor.svg',
  pants: '/assets/market-icons/pants.svg',
  gloves: '/assets/market-icons/gloves.svg',
  boots: '/assets/market-icons/boots.svg',
  wings: '/assets/market-icons/wings.svg',
  jewel: '/assets/market-icons/jewels.svg',
  pet: '/assets/market-icons/pets.png',
  accessory: '/assets/market-icons/accessories.svg',
};
const CATEGORY_GROUPS = [
  { id: 'armor', categories: ['helm', 'armor', 'pants', 'gloves', 'boots'] },
  { id: 'weapons', categories: ['bladeSword', 'bowCrossbow', 'staffStick', 'scepter', 'shieldBook'] },
  { id: 'other', categories: ['accessory', 'wings', 'jewel', 'pet'] },
];
const CLASS_FILTERS = [
  { label: 'Dark Knight', image: '/assets/characters/Dark_Knight.png' },
  { label: 'Dark Wizard', image: '/assets/characters/Dark_Wizard.png' },
  { label: 'Fairy Elf', image: '/assets/characters/Elf.png' },
  { label: 'Magic Gladiator', image: '/assets/characters/Magic_Gladiator.png' },
  { label: 'Dark Lord', image: '/assets/characters/Dark_Lord.png' },
  { label: 'Summoner', image: '/assets/characters/Summoner.png' },
  { label: 'Rage Fighter', image: '/assets/characters/Rage_Fighter.png' },
];
const PRICE_COMPONENTS = [
  { key: 'zen', currency: 'zen', denomination: null, name: 'Zen' },
  { key: 'wcoinc', currency: 'wcoinc', denomination: null, name: 'WC' },
  { key: 'bless', currency: 'jewels', denomination: 'Bless', name: 'Bless' },
  { key: 'soul', currency: 'jewels', denomination: 'Soul', name: 'Soul' },
  { key: 'life', currency: 'jewels', denomination: 'Life', name: 'Life' },
  { key: 'chaos', currency: 'jewels', denomination: 'Chaos', name: 'Chaos' },
  { key: 'creation', currency: 'jewels', denomination: 'Creation', name: 'Creation' },
];
const EMPTY_PRICE_PARTS = Object.freeze({ zen: '', wcoinc: '', bless: '', soul: '', life: '', chaos: '', creation: '' });
const TABS = [
  { id: 'market', icon: FaStore, key: 'market.tabMarket' },
  { id: 'my', icon: FaBoxOpen, key: 'market.tabMine' },
  { id: 'offers', icon: FaExchangeAlt, key: 'market.tabOffers' },
  { id: 'wallet', icon: FaWallet, key: 'market.tabWallet' },
  { id: 'history', icon: FaHistory, key: 'market.tabHistory' },
];

function currencyKey(currency) {
  const value = String(currency).toLowerCase();
  if (value === 'zen') return 'zen';
  if (['wcoinc', 'dc', 'dreamcoin', 'dreamcoins'].includes(value)) return 'wcoinc';
  return 'jewels';
}

function getListingPriceParts(listing) {
  if (Array.isArray(listing.priceComponents) && listing.priceComponents.length) {
    return listing.priceComponents.map((part) => {
      const denomination = part.denomination || part.type || null;
      const key = denomination ? String(denomination).toLowerCase() : currencyKey(part.currency);
      return { currency: part.currency, name: PRICE_COMPONENTS.find((component) => component.key === key)?.name || denomination || (key === 'jewels' ? 'Joyas' : key === 'wcoinc' ? 'WC' : 'Zen'), amount: part.amount };
    });
  }
  if (isJewelCurrency(listing.currency) && Array.isArray(listing.jewelCosts) && listing.jewelCosts.length) {
    return listing.jewelCosts.map((part) => ({ currency: 'jewels', name: part.name, amount: part.amount }));
  }
  const key = currencyKey(listing.currency);
  return [{ currency: key, name: key === 'jewels' ? 'Joyas' : PRICE_COMPONENTS.find((part) => part.key === key)?.name || 'Zen', amount: listing.price }];
}

function buildPriceComponents(amounts, allowedCurrencies = ['zen', 'wcoinc', 'jewels']) {
  return PRICE_COMPONENTS
    .filter(({ key, currency }) => allowedCurrencies.includes(currency) && Number(amounts[key]) > 0)
    .map(({ key, currency, denomination }) => ({ currency, ...(denomination ? { denomination } : {}), amount: Number(amounts[key]) }));
}

function allowedOfferCurrencies(listing) {
  const source = Array.isArray(listing.offerCurrencies) && listing.offerCurrencies.length
    ? listing.offerCurrencies
    : ['zen', 'wcoinc', 'jewels'];
  return [...new Set(source.map(currencyKey))];
}

function displayPrice(listing) {
  return getListingPriceParts(listing)
    .map((part) => `${Number(part.amount).toLocaleString('es-AR')} ${part.name}`)
    .join(' + ');
}

function isJewelCurrency(currency) {
  return ['jewel', 'jewels'].includes(String(currency).toLowerCase());
}

function getListingCategory(item) {
  const category = String(item.category || '').toLowerCase();
  const itemName = `${item.name || ''} ${item.type || ''} ${item.subCategory || ''} ${item.weaponType || ''}`.toLowerCase();
  if (/\b(shields?|books?|orbs?)\b/.test(itemName)) return 'shieldBook';
  if (['weapon', 'weapons', 'sword', 'blade', 'axe', 'mace', 'spear', 'bow', 'crossbow', 'staff', 'stick', 'wand', 'scepter', 'sceptre', 'shield', 'book', 'orb'].includes(category)) {
    if (['shield', 'book', 'orb'].includes(category)) return 'shieldBook';
    if (/\b(bow|crossbow)\b/.test(itemName) || ['bow', 'crossbow'].includes(category)) return 'bowCrossbow';
    if (/\b(staff|staves|stick|sticks|wand)\b/.test(itemName) || ['staff', 'stick', 'wand'].includes(category)) return 'staffStick';
    if (/\b(scepter|sceptre)\b/.test(itemName) || ['scepter', 'sceptre'].includes(category)) return 'scepter';
    return 'bladeSword';
  }
  if (['helm', 'helmet', 'helmets', 'head'].includes(category)) return 'helm';
  if (['glove', 'gloves', 'hands'].includes(category)) return 'gloves';
  if (['boot', 'boots', 'shoes'].includes(category)) return 'boots';
  if (['pant', 'pants', 'legs'].includes(category)) return 'pants';
  if (['armor', 'armour', 'body'].includes(category)) {
    if (/\b(helm|helmet)\b/.test(itemName)) return 'helm';
    if (/\b(glove|gloves)\b/.test(itemName)) return 'gloves';
    if (/\b(boot|boots)\b/.test(itemName)) return 'boots';
    if (/\b(pant|pants)\b/.test(itemName)) return 'pants';
    return 'armor';
  }
  return category;
}

function readSavedFavorites() {
  try {
    const saved = JSON.parse(localStorage.getItem('mubreda-market-favorites') || '[]');
    return Array.isArray(saved) ? saved.filter((id) => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

function CurrencyIcon({ currency }) {
  if (String(currency).toLowerCase() === 'zen') return <FaCoins aria-hidden="true" />;
  if (isJewelCurrency(currency)) return <img className="market-currency__icon" src="/assets/market-icons/jewels.svg" alt="" aria-hidden="true" />;
  return <span className="market-currency__wcoin" aria-hidden="true">WC</span>;
}

function CurrencyBasket({ value, onChange, allowedCurrencies, t }) {
  const components = PRICE_COMPONENTS.filter((part) => allowedCurrencies.includes(part.currency));
  return (
    <div className="market-price-basket">
      {components.map((part) => (
        <label className="market-price-basket__field" key={part.key}>
          <span><CurrencyIcon currency={part.currency} />{part.currency === 'wcoinc' ? t('market.credits') : part.name}</span>
          <input type="number" min="0" step="1" inputMode="numeric" placeholder="0" value={value[part.key] || ''} onChange={(event) => onChange((current) => ({ ...current, [part.key]: event.target.value }))} />
        </label>
      ))}
    </div>
  );
}

export default function MarketPage() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('market');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [currencyFilter, setCurrencyFilter] = useState('all');
  const [qualityFilters, setQualityFilters] = useState([]);
  const [levelFilter, setLevelFilter] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('list');
  const [filterPopup, setFilterPopup] = useState('');
  const [favorites, setFavorites] = useState(readSavedFavorites);
  const [selected, setSelected] = useState(null);
  const [purchaseListing, setPurchaseListing] = useState(null);
  const [notice, setNotice] = useState('');
  const [marketStatus, setMarketStatus] = useState(null);
  const [serverListings, setServerListings] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [inventoryBank, setInventoryBank] = useState('all');
  const [publishOpen, setPublishOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('');
  const [publishPriceParts, setPublishPriceParts] = useState({ ...EMPTY_PRICE_PARTS });
  const [marketCurrency, setMarketCurrency] = useState('zen');
  const [offerListing, setOfferListing] = useState(null);
  const [offerPriceParts, setOfferPriceParts] = useState({ ...EMPTY_PRICE_PARTS });
  const [offerPriceCurrencies, setOfferPriceCurrencies] = useState(['zen', 'wcoinc', 'jewels']);
  const [acceptOffers, setAcceptOffers] = useState(true);
  const [publishOfferCurrencies, setPublishOfferCurrencies] = useState(['zen', 'wcoinc', 'jewels']);
  const [tabData, setTabData] = useState({});
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawCharacter, setWithdrawCharacter] = useState('');
  const vaultInventory = inventory.filter((item) => inventoryBank === 'all' || (inventoryBank === 'site' ? item.source === 'site' : item.source !== 'site'));

  useEffect(() => {
    if (!selected && !purchaseListing && !publishOpen && !offerListing && !withdrawOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setSelected(null);
        setPurchaseListing(null);
        setPublishOpen(false);
        setOfferListing(null);
        setWithdrawOpen(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [offerListing, publishOpen, purchaseListing, selected, withdrawOpen]);

  useEffect(() => {
    try {
      localStorage.setItem('mubreda-market-favorites', JSON.stringify(favorites));
    } catch {
      /* Ignore browser storage restrictions. */
    }
  }, [favorites]);

  useEffect(() => {
    let active = true;
    fetchMarketStatus()
      .then((response) => {
        if (active) setMarketStatus(response.data || { connected: false, previewOnly: true });
      })
      .catch(() => {
        if (active) setMarketStatus({ connected: false, previewOnly: true });
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!marketStatus?.connected) return undefined;
    let active = true;
    fetchMarketListings({ page: 1, pageSize: 60 })
      .then((response) => {
        if (active) setServerListings(response.data?.items || []);
      })
      .catch((error) => {
        if (active) {
          setMarketStatus((current) => ({ ...current, connected: false, previewOnly: true }));
          setNotice(error.message || t('market.connectionError'));
        }
      });
    return () => { active = false; };
  }, [marketStatus?.connected, t]);

  const sourceListings = marketStatus?.connected ? serverListings : SAMPLE_LISTINGS.map((item) => ({ ...item, preview: true }));

  const listings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return sourceListings
      .filter((item) => category === 'all' || getListingCategory(item) === category)
      .filter((item) => currencyFilter === 'all' || String(item.currency).toLowerCase() === String(currencyFilter).toLowerCase() || (currencyFilter === 'Jewel' && isJewelCurrency(item.currency)))
      .filter((item) => classFilter === 'all' || item.className === 'Todos' || item.className === classFilter)
      .filter((item) => qualityFilters.every((quality) => item.qualities?.includes(quality)))
      .filter((item) => levelFilter === 'all' || (String(item.level).startsWith('+') && Number(String(item.level).replace(/[^0-9]/g, '')) >= Number(levelFilter)))
      .filter((item) => !query || `${item.name} ${item.className} ${item.options} ${item.seller}`.toLocaleLowerCase().includes(query))
      .sort((a, b) => {
        if (sort === 'newest' || sort === 'oldest') {
          if (a.createdAt && b.createdAt) return sort === 'newest' ? Date.parse(b.createdAt) - Date.parse(a.createdAt) : Date.parse(a.createdAt) - Date.parse(b.createdAt);
          return sort === 'newest' ? Number(a.id) - Number(b.id) : Number(b.id) - Number(a.id);
        }
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'level') return Number(String(b.level).replace(/[^0-9]/g, '')) - Number(String(a.level).replace(/[^0-9]/g, ''));
        if (sort === 'gear') return Number(b.gearScore || 0) - Number(a.gearScore || 0);
        if (a.currency !== b.currency) return a.currency.localeCompare(b.currency);
        return sort === 'low' ? a.price - b.price : b.price - a.price;
      });
  }, [category, classFilter, currencyFilter, levelFilter, qualityFilters, search, sort, sourceListings]);

  const showIntegrationNotice = (action) => {
    setNotice(t('market.actionUnavailable', { action }));
    window.setTimeout(() => setNotice(''), 5500);
  };

  const clearFilters = () => {
    setCategory('all');
    setSearch('');
    setClassFilter('all');
    setCurrencyFilter('all');
    setQualityFilters([]);
    setLevelFilter('all');
    setSort('newest');
    setFilterPopup('');
  };

  const toggleQuality = (quality) => {
    setQualityFilters((current) => current.includes(quality)
      ? current.filter((value) => value !== quality)
      : [...current, quality]);
  };

  const requireMarketAccount = () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/market')}`);
      return false;
    }
    return true;
  };

  const selectTab = async (nextTab) => {
    setTab(nextTab);
    const loaders = {
      my: fetchMyMarket,
      offers: fetchMarketOffers,
      wallet: fetchMarketWallet,
      history: fetchMarketHistory,
    };
    if (!loaders[nextTab] || !marketStatus?.connected || !requireMarketAccount()) return;
    try {
      const response = await loaders[nextTab]();
      setTabData((current) => ({ ...current, [nextTab]: response.data || {} }));
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const cancelListing = async (listingId) => {
    try {
      await cancelMarketListing(listingId);
      await selectTab('my');
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const resolveOffer = async (offerId, decision) => {
    try {
      await decideMarketOffer(offerId, decision);
      await selectTab('offers');
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const submitWithdrawal = async (event) => {
    event.preventDefault();
    if (!withdrawCharacter.trim() || Number(withdrawAmount) <= 0) return;
    try {
      await withdrawMarketBalance({ amount: Number(withdrawAmount), currency: marketCurrency, character: withdrawCharacter.trim() });
      setWithdrawOpen(false);
      setNotice(t('market.withdrawSubmitted'));
      await selectTab('wallet');
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const openPublish = async () => {
    if (!marketStatus?.connected) {
      const previewInventory = [
        { gameItemId: 'preview-market-item-1', name: 'Bone Blade +13', character: 'Dark Knight', source: 'game', width: 2, height: 4, icon: '⚔️' },
        { gameItemId: 'preview-market-item-2', name: 'Great Dragon Helm +9', character: 'Dark Knight', source: 'game', width: 2, height: 2, icon: '🪖' },
        { gameItemId: 'preview-market-item-3', name: 'Wings of Soul +11', character: 'Dark Wizard', source: 'game', width: 4, height: 4, icon: '🪽' },
        { gameItemId: 'preview-market-item-4', name: 'Ring of Earth', character: 'Fairy Elf', source: 'site', width: 1, height: 1, icon: '💍' },
        { gameItemId: 'preview-market-item-5', name: 'Crystal Staff +12', character: 'Dark Wizard', source: 'game', width: 2, height: 4, icon: '🪄' },
      ];
      setInventory(previewInventory);
      setInventoryBank('all');
      setSelectedInventoryItem('');
      setPublishPriceParts({ ...EMPTY_PRICE_PARTS });
      setAcceptOffers(true);
      setPublishOfferCurrencies(['zen', 'wcoinc', 'jewels']);
      setPublishOpen(true);
      return;
    }
    if (!requireMarketAccount()) return;
    try {
      const response = await fetchMarketInventory();
      const items = response.data?.items || [];
      setInventory(items);
      setInventoryBank('all');
      setSelectedInventoryItem(items[0]?.gameItemId || '');
      setPublishPriceParts({ ...EMPTY_PRICE_PARTS });
      setAcceptOffers(true);
      setPublishOfferCurrencies(['zen', 'wcoinc', 'jewels']);
      setPublishOpen(true);
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const submitPublish = async (event) => {
    event.preventDefault();
    const item = inventory.find((entry) => entry.gameItemId === selectedInventoryItem);
    const priceComponents = buildPriceComponents(publishPriceParts);
    if (!item || !priceComponents.length || (acceptOffers && !publishOfferCurrencies.length)) return;
    if (!marketStatus?.connected) {
      setPublishOpen(false);
      showIntegrationNotice(t('market.actionPublish'));
      return;
    }
    if (priceComponents.length > 1 && !marketStatus.capabilities?.mixedCurrency) {
      setNotice(t('market.mixedPaymentPending'));
      return;
    }
    try {
      const primaryPrice = priceComponents[0];
      await publishMarketListing({ gameItemId: item.gameItemId, character: item.character, price: primaryPrice.amount, currency: primaryPrice.currency, priceComponents, acceptOffers, offerCurrencies: acceptOffers ? publishOfferCurrencies : [] });
      setPublishOpen(false);
      setNotice(t('market.publishSubmitted'));
      const response = await fetchMarketListings({ page: 1, pageSize: 60 });
      setServerListings(response.data?.items || []);
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const submitOffer = async (event) => {
    event.preventDefault();
    const priceComponents = buildPriceComponents(offerPriceParts, offerPriceCurrencies);
    if (!offerListing || !priceComponents.length) return;
    if (!marketStatus?.connected || offerListing.preview) {
      setOfferListing(null);
      showIntegrationNotice(t('market.actionOffer'));
      return;
    }
    if (!requireMarketAccount()) return;
    if (priceComponents.length > 1 && !marketStatus.capabilities?.mixedCurrency) {
      setNotice(t('market.mixedPaymentPending'));
      return;
    }
    try {
      const primaryPrice = priceComponents[0];
      await makeMarketOffer(offerListing.id, { amount: primaryPrice.amount, currency: primaryPrice.currency, priceComponents, message: '' });
      setOfferListing(null);
      setNotice(t('market.offerSubmitted'));
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const onBuy = async (item) => {
    if (!marketStatus?.connected || item.preview) {
      showIntegrationNotice(t('market.actionBuy'));
      return;
    }
    if (!requireMarketAccount()) return;
    try {
      await buyMarketListing(item.id);
      setNotice(t('market.purchaseSubmitted'));
      const response = await fetchMarketListings({ page: 1, pageSize: 60 });
      setServerListings(response.data?.items || []);
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  const openOffer = (item) => {
    if (marketStatus?.connected && !item.preview && !requireMarketAccount()) return;
    setSelected(null);
    setPurchaseListing(null);
    setOfferPriceParts({ ...EMPTY_PRICE_PARTS });
    setOfferPriceCurrencies(allowedOfferCurrencies(item));
    setOfferListing(item);
  };

  const toggleOfferPriceCurrency = (currency) => {
    setOfferPriceCurrencies((current) => current.includes(currency)
      ? current.filter((value) => value !== currency)
      : [...current, currency]);
  };

  const togglePublishOfferCurrency = (currency) => {
    setPublishOfferCurrencies((current) => current.includes(currency)
      ? current.filter((value) => value !== currency)
      : [...current, currency]);
  };

  const renderListing = (item) => {
    const options = Array.isArray(item.options) ? item.options : String(item.options || '').split(' · ').filter(Boolean);
    const favorite = favorites.includes(item.id);
    const itemInfo = (
      <button type="button" className="market-listing__identity" onClick={() => setSelected(item)}>
        <span className={`market-listing__art market-card__art--${item.tone || 'steel'}`}><span>{item.mark || item.level}</span></span>
        <span className="market-listing__name-wrap"><strong>{item.name}</strong><small>{item.className} · {item.level}</small></span>
      </button>
    );
    const optionBadges = <div className="market-listing__options">{options.map((option, index) => <span className={`market-option market-option--${index % 4}`} key={`${item.id}-${option}`}>{option}</span>)}</div>;
    const price = <span className="market-listing__price"><CurrencyIcon currency={item.currency} />{displayPrice(item)}</span>;
    const favoriteButton = <button type="button" className={`market-listing__favorite${favorite ? ' is-saved' : ''}`} aria-label={favorite ? t('market.removeFavorite') : t('market.addFavorite')} aria-pressed={favorite} onClick={() => setFavorites((saved) => saved.includes(item.id) ? saved.filter((id) => id !== item.id) : [...saved, item.id])}><FaHeart /></button>;
    const buyButton = <button type="button" className="market-listing__buy" onClick={() => setPurchaseListing(item)}>{t('market.buy')}</button>;

    if (view === 'grid') {
      return <article className="market-grid-card" key={item.id}>{favoriteButton}{itemInfo}{optionBadges}<div className="market-grid-card__footer">{price}{buyButton}</div><small className="market-grid-card__seller"><FaClock /> {item.seller} · {item.age}</small></article>;
    }

    return <article className="market-listing" key={item.id}>{itemInfo}{optionBadges}{price}<span className="market-listing__seller"><FaClock /> {item.seller} · {item.age}</span><div className="market-listing__actions">{favoriteButton}{buyButton}</div></article>;
  };

  const refreshListings = async () => {
    if (!marketStatus?.connected) return;
    try {
      const response = await fetchMarketListings({ page: 1, pageSize: 60 });
      setServerListings(response.data?.items || []);
    } catch (error) {
      setNotice(error.message || t('market.connectionError'));
    }
  };

  return (
    <section className="market-page">
      <div className="market-heading">
        <h1>{t('market.titleShort')}</h1>
        <p>{t('market.subtitle')}</p>
        <span className={`market-status${marketStatus?.connected ? ' is-live' : ''}`}><FaShieldAlt /> {marketStatus?.connected ? t('market.liveBadge') : t('market.sampleBadge')}</span>
      </div>

      <div className="market-mainbar">
        <div className="market-tabs" role="tablist" aria-label={t('market.tabsLabel')}>
          {TABS.map(({ id, icon: Icon, key }) => (
            <button type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'is-active' : ''} key={id} onClick={() => selectTab(id)}>
              <Icon aria-hidden="true" /> <span>{t(key)}</span>
              {id === 'my' && <span className="market-tabs__count">{tabData.my?.listings?.length ?? 0}</span>}
            </button>
          ))}
        </div>
        <button type="button" className="market-primary" onClick={openPublish}><FaBoxOpen /> {t('market.publish')}</button>
      </div>

      {!marketStatus?.connected && <div className="market-preview-note" role="status"><FaShieldAlt /><span><strong>{t('market.previewTitle')}</strong> {t('market.previewText')}</span></div>}

      {notice && <div className="market-notice" role="status">{notice}</div>}

      {tab === 'market' ? (
        <>
          <div className="market-filterbar">
            <div className="market-filterbar__top">
              <div className="market-search"><FaSearch /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('market.search')} aria-label={t('market.search')} />{search && <button type="button" onClick={() => setSearch('')} aria-label={t('market.clearSearch')}><FaTimes /></button>}</div>
              <div className="market-categories" role="group" aria-label={t('market.categoriesLabel')}>
                <button type="button" className={`market-category-all${category === 'all' ? ' is-active' : ''}`} title={t('market.category.all')} aria-label={t('market.category.all')} aria-pressed={category === 'all'} onClick={() => setCategory('all')}><FaTh aria-hidden="true" /></button>
                {CATEGORY_GROUPS.map(({ id: groupId, categories }) => (
                  <div className={`market-category-group market-category-group--${groupId}`} role="group" aria-label={t(`market.categoryGroup.${groupId}`)} key={groupId}>
                    <span>{t(`market.categoryGroup.${groupId}`)}</span>
                    <div className="market-category-icons">
                      {categories.map((id) => { const Icon = CATEGORY_ICONS[id]; return <button type="button" key={id} title={t(`market.category.${id}`)} aria-label={t(`market.category.${id}`)} aria-pressed={category === id} className={category === id ? 'is-active' : ''} onClick={() => setCategory(id)}>{typeof Icon === 'string' ? <img src={Icon} alt="" aria-hidden="true" loading="lazy" /> : <Icon aria-hidden="true" />}</button>; })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="market-filterbar__bottom">
              <div className="market-currency-icons" role="group" aria-label={t('market.currency')}>
                {[['all', 'ALL'], ['Zen', 'ZEN'], ['WCoinC', 'WC'], ['Jewel', '✦']].map(([value, label]) => <button type="button" key={value} title={value === 'all' ? t('market.allCurrencies') : value === 'WCoinC' ? 'WC' : value} aria-label={value === 'all' ? t('market.allCurrencies') : value === 'WCoinC' ? 'WC' : value} aria-pressed={currencyFilter === value} className={currencyFilter === value ? 'is-active' : ''} onClick={() => setCurrencyFilter(value)}>{value === 'all' ? label : <CurrencyIcon currency={value} />}</button>)}
              </div>
              <span className="market-filterbar__divider" />
              <div className="market-class-icons" role="group" aria-label={t('market.class')}>
                {CLASS_FILTERS.map(({ label, image }) => <button type="button" key={label} title={label} aria-label={label} aria-pressed={classFilter === label} className={classFilter === label ? 'is-active' : ''} onClick={() => setClassFilter(classFilter === label ? 'all' : label)}><img src={image} alt="" aria-hidden="true" loading="lazy" /></button>)}
              </div>
              <span className="market-filterbar__divider" />
              <div className="market-option-shortcuts">
                {['excellent', 'ancient', 'luck', 'skill', 'socket'].map((quality) => <button type="button" key={quality} aria-pressed={qualityFilters.includes(quality)} className={qualityFilters.includes(quality) ? 'is-active' : ''} onClick={() => toggleQuality(quality)}>{t(`market.${quality}`)}</button>)}
              </div>
              <div className="market-filter-popover-wrap">
                <button type="button" className={`market-filter-select market-filter-select--green${filterPopup === 'excellent' ? ' is-open' : ''}`} onClick={() => setFilterPopup(filterPopup === 'excellent' ? '' : 'excellent')}>{t('market.excellent')} <FaChevronDown /></button>
                {filterPopup === 'excellent' && <div className="market-popover market-popover--options"><div className="market-popover__heading"><strong>{t('market.advancedOptions')}</strong><button type="button" onClick={() => setQualityFilters([])}>{t('market.reset')}</button></div><div className="market-popover__groups">{[['excellent', 'optionMaxLife'], ['ancient', 'optionMaxSd'], ['luck', 'optionDamageDecrease'], ['skill', 'optionReflect'], ['socket', 'optionSocket'], ['pvp', 'optionPvp']].map(([quality, label]) => <label key={quality}><input type="checkbox" checked={qualityFilters.includes(quality)} onChange={() => toggleQuality(quality)} /><span>{t(`market.${label}`)}</span><small>{quality.toUpperCase()}</small></label>)}</div><div className="market-popover__footer"><span>{t('market.resultsCount', { count: listings.length })}</span><button type="button" onClick={() => setFilterPopup('')}>{t('market.apply')}</button></div></div>}
              </div>
              <div className="market-filter-popover-wrap">
                <button type="button" className={`market-filter-select${filterPopup === 'level' ? ' is-open' : ''}`} onClick={() => setFilterPopup(filterPopup === 'level' ? '' : 'level')}>{t('market.level')} <FaChevronDown /></button>
                {filterPopup === 'level' && <div className="market-popover market-popover--level"><div className="market-popover__heading"><strong>{t('market.level')}</strong><button type="button" onClick={() => setLevelFilter('all')}>{t('market.reset')}</button></div><div className="market-level-current">{levelFilter === 'all' ? '+0 – +15' : `+${levelFilter} – +15`}</div><input type="range" min="0" max="15" step="1" value={levelFilter === 'all' ? 0 : levelFilter} onChange={(event) => setLevelFilter(event.target.value === '0' ? 'all' : event.target.value)} /><div className="market-level-presets">{['0', '7', '9', '11', '13', '15'].map((level) => <button type="button" key={level} aria-pressed={levelFilter === level} onClick={() => setLevelFilter(level)}>{`+${level}`}</button>)}</div><div className="market-popover__footer"><span>{t('market.resultsCount', { count: listings.length })}</span><button type="button" onClick={() => setFilterPopup('')}>{t('market.apply')}</button></div></div>}
              </div>
            </div>
          </div>

          <div className="market-resultbar">
            <strong>{t('market.found', { count: listings.length })}</strong>
            <div className="market-resultbar__actions">
              <label className="market-sort"><span>{t('market.sort')}</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">{t('market.sortNewest')}</option><option value="oldest">{t('market.sortOldest')}</option><option value="low">{t('market.sortLow')}</option><option value="high">{t('market.sortHigh')}</option><option value="level">{t('market.sortLevel')}</option><option value="gear">{t('market.sortGear')}</option><option value="name">{t('market.sortName')}</option></select><FaChevronDown /></label>
              <div className="market-view-switch" role="group" aria-label={t('market.view')}><button type="button" aria-label={t('market.gridView')} aria-pressed={view === 'grid'} className={view === 'grid' ? 'is-active' : ''} onClick={() => setView('grid')}><FaTh /></button><button type="button" aria-label={t('market.listView')} aria-pressed={view === 'list'} className={view === 'list' ? 'is-active' : ''} onClick={() => setView('list')}><FaList /></button></div>
              <button type="button" className="market-refresh" onClick={refreshListings} aria-label={t('market.refresh')}><FaSyncAlt /></button>
            </div>
          </div>

          {listings.length ? <div className={view === 'list' ? 'market-list' : 'market-grid'}>{view === 'list' && <div className="market-list__header"><span>{t('market.itemColumn')}</span><span>{t('market.optionsColumn')}</span><span>{t('market.priceColumn')}</span><span /></div>}{listings.map(renderListing)}</div> : <div className="market-empty"><FaSearch /><h3>{t('market.noResults')}</h3><p>{t('market.noResultsHint')}</p><button type="button" className="market-secondary" onClick={clearFilters}>{t('market.reset')}</button></div>}
        </>
      ) : (
        <div className="market-tab-panel">
          {tab === 'my' && <><span className="market-tab-panel__icon"><FaBoxOpen /></span><h2>{t('market.mineTitle')}</h2><p>{t('market.mineText')}</p>{tabData.my?.listings?.length ? <div className="market-account-list">{tabData.my.listings.map((item) => <div className="market-account-list__row" key={item.id}><span><strong>{item.name}</strong><small>{item.price} {item.currency}</small></span><button type="button" className="market-secondary" onClick={() => cancelListing(item.id)}>{t('market.cancelListing')}</button></div>)}</div> : <small className="market-tab-panel__empty">{marketStatus?.connected ? t('market.emptyMine') : t('market.bridgePending')}</small>}<button type="button" className="market-primary" onClick={openPublish}>{t('market.publish')}</button></>}
          {tab === 'offers' && <><span className="market-tab-panel__icon"><FaExchangeAlt /></span><h2>{t('market.offersTitle')}</h2><p>{t('market.offersText')}</p>{tabData.offers?.items?.length ? <div className="market-account-list">{tabData.offers.items.map((offer) => <div className="market-account-list__row" key={offer.id}><span><strong>{offer.itemName}</strong><small>{offer.amount} {offer.currency} · {offer.username}</small></span><span className="market-account-list__actions"><button type="button" className="market-secondary" onClick={() => resolveOffer(offer.id, 'accept')}>{t('market.accept')}</button><button type="button" className="market-secondary" onClick={() => resolveOffer(offer.id, 'decline')}>{t('market.decline')}</button></span></div>)}</div> : <small className="market-tab-panel__empty">{marketStatus?.connected ? t('market.emptyOffers') : t('market.bridgePending')}</small>}</>}
          {tab === 'wallet' && <><span className="market-tab-panel__icon"><FaWallet /></span><h2>{t('market.walletTitle')}</h2><p>{t('market.walletText')}</p><div className="market-wallet-preview"><span>Zen <strong>{tabData.wallet?.balances?.zen?.toLocaleString() ?? '—'}</strong></span><span>WC <strong>{tabData.wallet?.balances?.wcoinc?.toLocaleString() ?? '—'}</strong></span><span>{t('market.jewels')} <strong>{tabData.wallet?.balances?.jewels?.toLocaleString() ?? '—'}</strong></span></div>{marketStatus?.connected && <button type="button" className="market-primary" onClick={() => { if (requireMarketAccount()) setWithdrawOpen(true); }}>{t('market.withdraw')}</button>}</>}
          {tab === 'history' && <><span className="market-tab-panel__icon"><FaHistory /></span><h2>{t('market.historyTitle')}</h2><p>{t('market.historyText')}</p>{tabData.history?.items?.length ? <div className="market-account-list">{tabData.history.items.map((entry) => <div className="market-account-list__row" key={entry.id}><span><strong>{entry.itemName}</strong><small>{entry.action} · {entry.amount} {entry.currency}</small></span><time>{entry.at}</time></div>)}</div> : <small className="market-tab-panel__empty">{marketStatus?.connected ? t('market.emptyHistory') : t('market.bridgePending')}</small>}</>}
        </div>
      )}

      {tab !== 'market' && <div className="market-how"><div className="market-how__icon"><FaShieldAlt /></div><div><h2>{t('market.howTitle')}</h2><p>{t('market.howText')}</p></div><Link to="/guides">{t('market.readGuide')} <span aria-hidden="true">→</span></Link></div>}

      {selected && (
        <div className="market-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <section className="market-modal" role="dialog" aria-modal="true" aria-labelledby="market-modal-title">
            <button type="button" className="market-modal__close" onClick={() => setSelected(null)} aria-label={t('market.close')}><FaTimes /></button>
            <span className={`market-card__art market-card__art--${selected.tone}`}><span className="market-card__art-ring" /><span className="market-card__art-mark">{selected.mark}</span><span className="market-card__art-caption">{t(`market.category.${selected.category}`)}</span></span>
            <p className="market-kicker">{selected.className} · {selected.level}</p>
            <h2 id="market-modal-title">{selected.name}</h2>
            <p className="market-modal__options">{selected.options}</p>
            <div className="market-modal__meta"><span>{t('market.seller')}: <strong>{selected.seller}</strong></span><span>{t('market.published')}: <strong>{selected.age}</strong></span></div>
            <div className="market-modal__price"><CurrencyIcon currency={selected.currency} />{displayPrice(selected)}</div>
            <div className="market-modal__actions"><button type="button" className="market-primary" onClick={() => { setPurchaseListing(selected); setSelected(null); }}>{t('market.buy')}</button><button type="button" className="market-secondary" onClick={() => openOffer(selected)}>{t('market.makeOffer')}</button></div>
            <small className="market-modal__preview">{marketStatus?.connected ? t('market.liveText') : t('market.previewText')}</small>
          </section>
        </div>
      )}

      {purchaseListing && (
        <div className="market-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setPurchaseListing(null)}>
          <section className="market-trade-dialog" role="dialog" aria-modal="true" aria-labelledby="market-buy-title">
            <button type="button" className="market-modal__close" onClick={() => setPurchaseListing(null)} aria-label={t('market.close')}><FaTimes /></button>
            <aside className="market-trade-dialog__item">
              <span className={`market-card__art market-card__art--${purchaseListing.tone || 'steel'}`}><span className="market-card__art-ring" /><span className="market-card__art-mark">{purchaseListing.mark || purchaseListing.level}</span><span className="market-card__art-caption">{t(`market.category.${purchaseListing.category}`)}</span></span>
              <h3>{purchaseListing.name}</h3>
              <strong>{purchaseListing.className} · {purchaseListing.level}</strong>
              <p>{purchaseListing.options}</p>
              <small>{t('market.seller')}: {purchaseListing.seller}</small>
            </aside>
            <div className="market-trade-dialog__body">
              <header className="market-trade-dialog__heading"><span className="market-trade-dialog__icon"><CurrencyIcon currency={purchaseListing.currency} /></span><div><h2 id="market-buy-title">{t('market.buyDialogTitle')}</h2><strong>{purchaseListing.name}</strong><p>{t('market.buyDialogSubtitle')}</p></div></header>
              <h3 className="market-trade-dialog__section-title">{isJewelCurrency(purchaseListing.currency) ? t('market.payAllTogether') : t('market.sellerPrice')}</h3>
              <div className="market-trade-dialog__breakdown">
                {getListingPriceParts(purchaseListing).map((part) => (
                  <div className="market-trade-dialog__breakdown-row" key={`${part.name}-${part.amount}`}><span><CurrencyIcon currency={part.currency} />{part.name}</span><strong>{Number(part.amount).toLocaleString('es-AR')}</strong><small>{isJewelCurrency(part.currency) ? t('market.bankBalanceUnknown') : ''}</small></div>
                ))}
              </div>
              {!marketStatus?.connected && <div className="market-trade-dialog__notice"><FaShieldAlt />{t('market.previewText')}</div>}
              <footer className="market-trade-dialog__actions"><button type="button" className="market-secondary" onClick={() => openOffer(purchaseListing)}>{t('market.offerYourPrice')}</button><button type="button" className="market-primary" onClick={() => { setPurchaseListing(null); onBuy(purchaseListing); }}><FaStore />{t('market.buyAtPrice', { price: displayPrice(purchaseListing) })}</button></footer>
            </div>
          </section>
        </div>
      )}

      {(publishOpen || offerListing) && (
        <div className="market-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && (setPublishOpen(false), setOfferListing(null))}>
          <section className={`market-modal${offerListing ? ' market-modal--offer' : ''}${publishOpen ? ' market-modal--publish' : ''}`} role="dialog" aria-modal="true" aria-labelledby="market-action-title">
            <button type="button" className="market-modal__close" onClick={() => { setPublishOpen(false); setOfferListing(null); }} aria-label={t('market.close')}><FaTimes /></button>
            {offerListing && <aside className="market-modal__offer-item"><span className={`market-card__art market-card__art--${offerListing.tone || 'steel'}`}><span className="market-card__art-ring" /><span className="market-card__art-mark">{offerListing.mark || offerListing.level}</span><span className="market-card__art-caption">{t(`market.category.${offerListing.category}`)}</span></span><h3>{offerListing.name}</h3><strong>{offerListing.className} · {offerListing.level}</strong><p>{offerListing.options}</p><small>{t('market.seller')}: {offerListing.seller}</small></aside>}
            <div className={offerListing ? 'market-modal__offer-content' : ''}>
              <p className="market-kicker">{publishOpen ? t('market.kicker') : t('market.makeOffer')}</p>
              <h2 id="market-action-title">{publishOpen ? t('market.publish') : t('market.makeOffer')}</h2>
            <form className="market-action-form" onSubmit={publishOpen ? submitPublish : submitOffer}>
              {publishOpen ? inventory.length ? <section className="market-vault-picker" aria-label="Inventario del personaje">
                <header className="market-vault-picker__heading"><div><strong>Inventario del personaje</strong><small>Baúl de muestra · cuadrícula 8 × 15</small></div><span>{vaultInventory.length} objetos</span></header>
                <div className="market-vault-picker__banks"><button type="button" className={inventoryBank === 'all' ? 'is-selected' : ''} onClick={() => { setInventoryBank('all'); setSelectedInventoryItem(''); }}>Todos</button><button type="button" className={inventoryBank === 'game' ? 'is-selected' : ''} onClick={() => { setInventoryBank('game'); setSelectedInventoryItem(''); }}>Baúl del juego</button><button type="button" className={inventoryBank === 'site' ? 'is-selected' : ''} onClick={() => { setInventoryBank('site'); setSelectedInventoryItem(''); }}>Baúl web</button></div>
                <div className="market-vault-grid" role="listbox" aria-label="Seleccionar objeto">
                  {Array.from({ length: 120 }, (_, slot) => {
                    const item = vaultInventory.find((entry, index) => {
                      const starts = [1, 4, 20, 39, 49];
                      return starts[index] === slot;
                    });
                    return item ? <button type="button" role="option" aria-selected={selectedInventoryItem === item.gameItemId} key={item.gameItemId} className={`market-vault-item${selectedInventoryItem === item.gameItemId ? ' is-selected' : ''}`} style={{ gridColumn: `${slot % 8 + 1} / span ${Math.min(4, item.width || 1)}`, gridRow: `${Math.floor(slot / 8) + 1} / span ${Math.min(4, item.height || 1)}` }} onClick={() => setSelectedInventoryItem(item.gameItemId)}><span>{item.icon || '✦'}</span><strong>{item.name}</strong><small>{item.source === 'site' ? 'Baúl web' : 'Baúl del juego'}</small></button> : <span key={`slot-${slot}`} className="market-vault-cell" style={{ gridColumn: slot % 8 + 1, gridRow: Math.floor(slot / 8) + 1 }} aria-hidden="true" />;
                  })}
                </div>
                {selectedInventoryItem && <p className="market-vault-picker__selection">Seleccionado: <strong>{inventory.find((item) => item.gameItemId === selectedInventoryItem)?.name}</strong></p>}
              </section> : <p className="market-action-form__item">{t('market.emptyInventory')}</p> : <p className="market-action-form__item">{offerListing?.name}<small>{t('market.askingPrice')}: {offerListing ? displayPrice(offerListing) : ''}</small></p>}
              {offerListing && <div className="market-offer-price"><span>{t('market.sellerPrice')}</span><strong>{displayPrice(offerListing)}</strong></div>}
              {publishOpen ? <>
                <h3 className="market-price-basket__title">{t('market.askingPrice')}</h3>
                <CurrencyBasket value={publishPriceParts} onChange={setPublishPriceParts} allowedCurrencies={['zen', 'wcoinc', 'jewels']} t={t} />
                <div className="market-counteroffer-settings"><label className="market-counteroffer-settings__toggle"><input type="checkbox" checked={acceptOffers} onChange={(event) => setAcceptOffers(event.target.checked)} /><span>{t('market.acceptOffers')}</span></label>{acceptOffers && <><p>{t('market.offerCurrenciesHint')}</p><div className="market-price-currency-buttons">{['zen', 'wcoinc', 'jewels'].map((currency) => <button type="button" key={currency} aria-pressed={publishOfferCurrencies.includes(currency)} className={publishOfferCurrencies.includes(currency) ? 'is-selected' : ''} onClick={() => togglePublishOfferCurrency(currency)}>{currency === 'zen' ? 'Zen' : currency === 'wcoinc' ? t('market.credits') : t('market.jewels')}</button>)}</div></>}</div>
              </> : <>
                <h3 className="market-price-basket__title">{t('market.yourOffer')}</h3>
                <div className="market-price-currency-buttons">{allowedOfferCurrencies(offerListing).map((currency) => <button type="button" key={currency} aria-pressed={offerPriceCurrencies.includes(currency)} className={offerPriceCurrencies.includes(currency) ? 'is-selected' : ''} onClick={() => toggleOfferPriceCurrency(currency)}>{currency === 'zen' ? 'Zen' : currency === 'wcoinc' ? t('market.credits') : t('market.jewels')}</button>)}</div>
                <CurrencyBasket value={offerPriceParts} onChange={setOfferPriceParts} allowedCurrencies={offerPriceCurrencies} t={t} />
                <div className="market-offer-reserve"><strong>{t('market.yourOffer')}</strong><span>{buildPriceComponents(offerPriceParts, offerPriceCurrencies).length ? displayPrice({ priceComponents: buildPriceComponents(offerPriceParts, offerPriceCurrencies) }) : '—'}</span></div>
                <div className="market-offer-info"><FaShieldAlt />{t('market.offerReserveHelp')}</div>
              </>}
              <button type="submit" className="market-primary" disabled={(publishOpen && (!inventory.length || !selectedInventoryItem || !buildPriceComponents(publishPriceParts).length || (acceptOffers && !publishOfferCurrencies.length))) || (offerListing && !buildPriceComponents(offerPriceParts, offerPriceCurrencies).length)}>{publishOpen ? t('market.confirmPublish') : t('market.sendOffer')}</button>
            </form>
            </div>
          </section>
        </div>
      )}

      {withdrawOpen && (
        <div className="market-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setWithdrawOpen(false)}>
          <section className="market-modal" role="dialog" aria-modal="true" aria-labelledby="market-withdraw-title">
            <button type="button" className="market-modal__close" onClick={() => setWithdrawOpen(false)} aria-label={t('market.close')}><FaTimes /></button>
            <p className="market-kicker">{t('market.tabWallet')}</p>
            <h2 id="market-withdraw-title">{t('market.withdraw')}</h2>
            <form className="market-action-form" onSubmit={submitWithdrawal}>
              <label>{t('market.withdrawAmount')}<input type="number" min="1" step="1" required value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} /></label>
              <label>{t('market.currency')}<select value={marketCurrency} onChange={(event) => setMarketCurrency(event.target.value)}><option value="zen">Zen</option><option value="wcoinc">WC</option><option value="jewels">{t('market.jewels')}</option></select></label>
              <label>{t('market.character')}<input type="text" maxLength="10" required value={withdrawCharacter} onChange={(event) => setWithdrawCharacter(event.target.value)} /></label>
              <button type="submit" className="market-primary">{t('market.confirmWithdraw')}</button>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}
