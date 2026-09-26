import { NotificationPriority, PlayerNotifications } from '../../src/notification/PlayerNotifications';
import { Player } from '../../src/Player';
import { ServerEvents } from '../../src/Events';
import { WebSocket } from 'ws';

jest.mock('../../src/Events');

describe('PlayerNotifications', () => {
  let notifications: PlayerNotifications;
  let mockPlayer: jest.Mocked<Player>;
  let mockWebsocket: WebSocket;
  let onSpy: jest.SpyInstance;
  let cities: any[];
  let units: any[];
  let currentResearch: any;
  let techsLeft: boolean;

  const makeUnit = (id: number, options: { movement?: number; queued?: boolean; fortified?: boolean; building?: string } = {}) => ({
    getId: () => id,
    getAvailableMovement: () => options.movement ?? 2,
    hasMovementQueue: () => options.queued ?? false,
    isFortified: () => options.fortified ?? false,
    getBuildingImprovement: () => options.building,
  });

  const makeCity = (name: string, queueLength: number, canStrike = false) => ({
    getName: () => name,
    getProductionQueue: () => new Array(queueLength).fill({}),
    canStrike: () => canStrike,
  });

  const triggerServerEvent = (eventName: string, data?: any) => {
    const registration = onSpy.mock.calls.find(([options]) => options.eventName === eventName);
    registration[0].callback(data, mockWebsocket);
  };

  const ids = () => notifications.getNotifications().map((notification) => notification.id);

  beforeEach(() => {
    jest.clearAllMocks();
    cities = [];
    units = [];
    currentResearch = null;
    techsLeft = true;
    mockWebsocket = {} as WebSocket;

    onSpy = jest.spyOn(ServerEvents, 'on').mockImplementation(() => { });

    mockPlayer = {
      getCities: jest.fn(() => cities),
      getUnits: jest.fn(() => units),
      getCurrentResearch: jest.fn(() => currentResearch),
      hasTechsLeftToResearch: jest.fn(() => techsLeft),
      getWebsocket: jest.fn(() => mockWebsocket),
      sendNetworkEvent: jest.fn(),
    } as unknown as jest.Mocked<Player>;

    notifications = new PlayerNotifications(mockPlayer);
  });

  it('has nothing to say before the player has a city or a unit', () => {
    expect(notifications.getNotifications()).toEqual([]);
  });

  it('asks for research once a city exists and nothing is being researched', () => {
    cities.push(makeCity('Rome', 1));
    expect(ids()).toEqual(['research']);

    currentResearch = { techName: 'Pottery' };
    expect(ids()).toEqual([]);
  });

  it('does not ask for research once every tech is researched', () => {
    cities.push(makeCity('Rome', 1));
    techsLeft = false;
    expect(ids()).toEqual([]);
  });

  it('lists every city with an empty production queue', () => {
    cities.push(makeCity('Rome', 0), makeCity('Antium', 1), makeCity('Cumae', 0));
    currentResearch = { techName: 'Pottery' };

    const [production] = notifications.getNotifications();
    expect(production.id).toBe('production');
    expect(production.cityNames).toEqual(['Rome', 'Cumae']);
    expect(production.turnBlockingLabel).toBe('Choose Production');
  });

  it('lists only units that can still move and have no orders', () => {
    units.push(makeUnit(1), makeUnit(2, { movement: 0 }), makeUnit(3, { queued: true }), makeUnit(4, { fortified: true }), makeUnit(5), makeUnit(6, { building: 'Farm' }));

    const [unitOrders] = notifications.getNotifications();
    expect(unitOrders.unitIds).toEqual([1, 5]);
    expect(unitOrders.turnBlockingLabel).toBeUndefined();
  });

  it('orders notifications by priority, research first', () => {
    cities.push(makeCity('Rome', 0));
    units.push(makeUnit(1));
    notifications.addMessage('ICON_PRODUCTION', 'Rome has finished Warrior.');

    const priorities = notifications.getNotifications().map((notification) => notification.priority);
    expect(ids().slice(0, 2)).toEqual(['research', 'production']);
    expect(priorities).toEqual([...priorities].sort((a, b) => b - a));
  });

  it('lists the cities that can strike an enemy', () => {
    cities.push(makeCity('Rome', 1, true), makeCity('Antium', 1), makeCity('Cumae', 1, true));

    const cityStrike = notifications.getNotifications().find((notification) => notification.id === 'cityStrike');
    expect(cityStrike).toMatchObject({ type: 'cityStrike', icon: 'ICON_TARGET', cityNames: ['Rome', 'Cumae'] });
  });

  it('keeps a message until it is dismissed or the next turn starts', () => {
    notifications.addMessage('ICON_PRODUCTION', 'Rome has finished Warrior.');
    notifications.addMessage('ICON_PRODUCTION', 'Rome has finished Monument.');
    const [first, second] = notifications.getNotifications();

    triggerServerEvent('dismissNotification', { id: first.id });
    expect(ids()).toEqual([second.id]);

    notifications.startTurn(2);
    expect(ids()).toEqual([]);
  });

  it('shows the move tip only on the first turn, once, and drops it when a unit moves', () => {
    notifications.startTurn(1);
    triggerServerEvent('requestMoveUnitTip');
    triggerServerEvent('requestMoveUnitTip');
    expect(notifications.getNotifications()).toEqual([
      expect.objectContaining({ id: 'moveUnitTip', priority: NotificationPriority.LOWEST }),
    ]);

    triggerServerEvent('moveUnit', {});
    expect(ids()).toEqual([]);

    notifications.startTurn(2);
    triggerServerEvent('requestMoveUnitTip');
    expect(ids()).toEqual([]);
  });

  it('only sends the list when it changes, unless asked to resend', () => {
    notifications.refresh();
    expect(mockPlayer.sendNetworkEvent).not.toHaveBeenCalled();

    cities.push(makeCity('Rome', 1));
    notifications.refresh();
    notifications.refresh();
    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledTimes(1);
    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledWith({
      event: 'notifications',
      notifications: [expect.objectContaining({ id: 'research', type: 'research' })],
    });

    triggerServerEvent('requestNotifications');
    expect(mockPlayer.sendNetworkEvent).toHaveBeenCalledTimes(2);
  });
});
