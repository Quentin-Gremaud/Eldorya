import { CockpitStateFinder } from '../finders/cockpit-state.finder.js';

describe('CockpitStateFinder', () => {
  let finder: CockpitStateFinder;
  let mockPrisma: {
    session: { findUnique: jest.Mock };
    sessionAction: { count: jest.Mock };
    campaignMember: { findMany: jest.Mock };
    character: { findMany: jest.Mock };
  };

  const sessionId = '550e8400-e29b-41d4-a716-446655440000';
  const campaignId = '660e8400-e29b-41d4-a716-446655440001';
  const gmUserId = 'user_gm_123';
  const player1Id = 'user_player_1';
  const player2Id = 'user_player_2';

  const activeSession = {
    id: sessionId,
    campaignId,
    gmUserId,
    mode: 'live',
    pipelineMode: 'optional',
    status: 'active',
    startedAt: new Date('2026-03-19T10:00:00Z'),
    endedAt: null,
  };

  beforeEach(() => {
    mockPrisma = {
      session: { findUnique: jest.fn() },
      sessionAction: { count: jest.fn() },
      campaignMember: { findMany: jest.fn() },
      character: { findMany: jest.fn() },
    };

    finder = new CockpitStateFinder(mockPrisma as any);
  });

  it('should return null when session not found', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(null);

    const result = await finder.findCockpitState(sessionId, campaignId);

    expect(result).toBeNull();
  });

  it('should return null when campaign ID does not match', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      ...activeSession,
      campaignId: 'different-campaign',
    });

    const result = await finder.findCockpitState(sessionId, campaignId);

    expect(result).toBeNull();
  });

  it('should return null when session is not active', async () => {
    mockPrisma.session.findUnique.mockResolvedValue({
      ...activeSession,
      status: 'ended',
    });

    const result = await finder.findCockpitState(sessionId, campaignId);

    expect(result).toBeNull();
  });

  it('should return cockpit state with players and pending action count', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(activeSession);
    mockPrisma.sessionAction.count.mockResolvedValue(3);
    mockPrisma.campaignMember.findMany.mockResolvedValue([
      { id: 'mem-1', campaignId, userId: gmUserId, role: 'gm' },
      { id: 'mem-2', campaignId, userId: player1Id, role: 'player' },
      { id: 'mem-3', campaignId, userId: player2Id, role: 'player' },
    ]);
    mockPrisma.character.findMany.mockResolvedValue([
      { id: 'char-1', userId: player1Id, name: 'Aragorn', status: 'approved' },
      { id: 'char-2', userId: player2Id, name: 'Legolas', status: 'pending' },
    ]);

    const result = await finder.findCockpitState(sessionId, campaignId);

    expect(result).toEqual({
      sessionId,
      campaignId,
      gmUserId,
      mode: 'live',
      pipelineMode: 'optional',
      pendingActionsCount: 3,
      players: expect.arrayContaining([
        {
          userId: player1Id,
          role: 'player',
          characterId: 'char-1',
          characterName: 'Aragorn',
          characterStatus: 'approved',
        },
        {
          userId: player2Id,
          role: 'player',
          characterId: 'char-2',
          characterName: 'Legolas',
          characterStatus: 'pending',
        },
      ]),
    });
    expect(result!.players).toHaveLength(2);
  });

  it('should exclude GM from players list', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(activeSession);
    mockPrisma.sessionAction.count.mockResolvedValue(0);
    mockPrisma.campaignMember.findMany.mockResolvedValue([
      { id: 'mem-1', campaignId, userId: gmUserId, role: 'gm' },
      { id: 'mem-2', campaignId, userId: player1Id, role: 'player' },
    ]);
    mockPrisma.character.findMany.mockResolvedValue([]);

    const result = await finder.findCockpitState(sessionId, campaignId);

    expect(result!.players).toHaveLength(1);
    expect(result!.players[0].userId).toBe(player1Id);
  });

  it('should handle player without character', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(activeSession);
    mockPrisma.sessionAction.count.mockResolvedValue(0);
    mockPrisma.campaignMember.findMany.mockResolvedValue([
      { id: 'mem-1', campaignId, userId: gmUserId, role: 'gm' },
      { id: 'mem-2', campaignId, userId: player1Id, role: 'player' },
    ]);
    mockPrisma.character.findMany.mockResolvedValue([]);

    const result = await finder.findCockpitState(sessionId, campaignId);

    expect(result!.players[0]).toEqual({
      userId: player1Id,
      role: 'player',
      characterId: null,
      characterName: null,
      characterStatus: null,
    });
  });

  it('should apply campaign isolation to all queries', async () => {
    mockPrisma.session.findUnique.mockResolvedValue(activeSession);
    mockPrisma.sessionAction.count.mockResolvedValue(0);
    mockPrisma.campaignMember.findMany.mockResolvedValue([]);
    mockPrisma.character.findMany.mockResolvedValue([]);

    await finder.findCockpitState(sessionId, campaignId);

    expect(mockPrisma.sessionAction.count).toHaveBeenCalledWith({
      where: { sessionId, campaignId, status: 'pending' },
    });
    expect(mockPrisma.campaignMember.findMany).toHaveBeenCalledWith({
      where: { campaignId },
    });
    expect(mockPrisma.character.findMany).toHaveBeenCalledWith({
      where: { campaignId },
      select: { id: true, userId: true, name: true, status: true },
    });
  });
});
