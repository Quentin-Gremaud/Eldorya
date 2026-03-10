import { DomainException } from '../../../shared/exceptions/domain.exception.js';
import { FogStateAlreadyInitializedException } from '../exceptions/fog-state-already-initialized.exception.js';
import { FogZoneAlreadyRevealedException } from '../exceptions/fog-zone-already-revealed.exception.js';
import { FogZoneNotFoundException } from '../exceptions/fog-zone-not-found.exception.js';
import { InvalidFogZoneException } from '../exceptions/invalid-fog-zone.exception.js';
import { InvalidFogStateIdException } from '../exceptions/invalid-fog-state-id.exception.js';
import { FogStateNotInitializedException } from '../exceptions/fog-state-not-initialized.exception.js';

describe('Fog State Domain Exceptions', () => {
  describe('FogStateAlreadyInitializedException', () => {
    it('should extend DomainException', () => {
      const ex = FogStateAlreadyInitializedException.forPlayer('cid', 'pid');
      expect(ex).toBeInstanceOf(DomainException);
      expect(ex).toBeInstanceOf(Error);
    });

    it('should include campaign and player in message', () => {
      const ex = FogStateAlreadyInitializedException.forPlayer('campaign-1', 'player-1');
      expect(ex.message).toContain('campaign-1');
      expect(ex.message).toContain('player-1');
    });
  });

  describe('FogZoneAlreadyRevealedException', () => {
    it('should extend DomainException', () => {
      const ex = FogZoneAlreadyRevealedException.forZone('zone-1', 'cid', 'pid');
      expect(ex).toBeInstanceOf(DomainException);
    });

    it('should include zone, campaign and player in message', () => {
      const ex = FogZoneAlreadyRevealedException.forZone('zone-1', 'campaign-1', 'player-1');
      expect(ex.message).toContain('zone-1');
      expect(ex.message).toContain('campaign-1');
      expect(ex.message).toContain('player-1');
    });
  });

  describe('FogZoneNotFoundException', () => {
    it('should extend DomainException', () => {
      const ex = FogZoneNotFoundException.forZone('zone-1', 'cid', 'pid');
      expect(ex).toBeInstanceOf(DomainException);
    });

    it('should include zone, campaign and player in message', () => {
      const ex = FogZoneNotFoundException.forZone('zone-1', 'campaign-1', 'player-1');
      expect(ex.message).toContain('zone-1');
      expect(ex.message).toContain('campaign-1');
      expect(ex.message).toContain('player-1');
    });
  });

  describe('InvalidFogZoneException', () => {
    it('should extend DomainException', () => {
      const ex = InvalidFogZoneException.invalidId('bad');
      expect(ex).toBeInstanceOf(DomainException);
    });

    it('should create exception for invalid id', () => {
      const ex = InvalidFogZoneException.invalidId('bad');
      expect(ex.message).toContain('bad');
    });

    it('should create exception for invalid mapLevelId', () => {
      const ex = InvalidFogZoneException.invalidMapLevelId('bad');
      expect(ex.message).toContain('bad');
    });

    it('should create exception for invalid coordinate', () => {
      const ex = InvalidFogZoneException.invalidCoordinate('x', NaN);
      expect(ex.message).toContain('x');
    });

    it('should create exception for invalid dimension', () => {
      const ex = InvalidFogZoneException.invalidDimension('width', -5);
      expect(ex.message).toContain('width');
    });
  });

  describe('FogStateNotInitializedException', () => {
    it('should extend DomainException', () => {
      const ex = FogStateNotInitializedException.forPlayer('cid', 'pid');
      expect(ex).toBeInstanceOf(DomainException);
      expect(ex).toBeInstanceOf(Error);
    });

    it('should include campaign and player in message', () => {
      const ex = FogStateNotInitializedException.forPlayer('campaign-1', 'player-1');
      expect(ex.message).toContain('campaign-1');
      expect(ex.message).toContain('player-1');
      expect(ex.message).toContain('not initialized');
    });
  });

  describe('InvalidFogStateIdException', () => {
    it('should extend DomainException', () => {
      const ex = InvalidFogStateIdException.invalidCampaignId('bad');
      expect(ex).toBeInstanceOf(DomainException);
    });

    it('should create exception for invalid format', () => {
      const ex = InvalidFogStateIdException.invalidFormat('bad');
      expect(ex.message).toContain('bad');
    });
  });
});
