import express from 'express';
import defaultCardConfig from './defaultCardConfig';
import {validateJwt} from './commandHandlers/auth/jwtService';

/**
 * This module handles incoming requests to the REST api.
 *
 * Not a very extensive API... Most of the (user-interaction triggered) communication between client and server (story-, estimation- and user-related)
 * is done via websocket connection.
 *
 * @param app the express app object
 * @param store the roomsStore object
 */
export default function restApiFactory(app, store) {
  const restRouter = express.Router();

  restRouter.get('/status', async (req, res) => {
    const status = await buildStatusObject(store);
    res.json(status);
  });

  restRouter.get('/export/room/:roomId', userIdInRoomCheck, async (req, res) => {
    const roomExport = await buildRoomExportObject(store, req.params.roomId);

    if (!roomExport) {
      res.status(404).json({message: 'room not found'});
      return;
    }

    res.json(roomExport);
  });

  restRouter.get('/room/:roomId', userIdInRoomCheck, async (req, res) => {
    const roomState = await buildRoomStateObject(store, req.params.roomId);

    if (!roomState) {
      res.status(404).json({message: 'room not found'});
      return;
    }
    res.json(roomState);
  });

  app.use('/api', restRouter);

  /**
   * Express middleware function for fetching/exporting rooms:
   * Checks if a valid JWT is passed in the request and that the specified user belongs to a specific room and is thus allowed to fetch information about this room.
   *
   * Use this middleware for routes with :roomId  path parameter!
   * Request is expected to specify Header Field "Authorization"
   * Value of Header Field "Authorization" must contain a valid (issued by us, not expired) JWT and match userId of one of the users in the room
   *
   * @param req
   * @param res
   * @param next
   * @return {Promise<void>}
   */
  async function userIdInRoomCheck(req, res, next) {
    const {
      params: {roomId}
    } = req;

    try {
      const isOK = await canUserReadRoom(roomId, req.get('Authorization'));
      if (isOK) {
        next();
      } else {
        res.status(403).json({message: 'Forbidden'});
      }
    } catch (e) {
      res.status(404).json({message: 'room not found'});
    }
  }

  /**
   *
   * @param roomId
   * @param {string} authorizationHeaderField
   * @return {Promise<boolean>}
   */
  async function canUserReadRoom(roomId, authorizationHeaderField) {
    if (!roomId) {
      throw new Error('no such room');
    }
    const room = await store.getRoomById(roomId);
    if (!room) {
      throw new Error('no such room');
    }
    if (!room.password) {
      return true;
    }

    if (!authorizationHeaderField || authorizationHeaderField.length < 8) {
      return false;
    }
    const token = authorizationHeaderField.substring(7);
    if (!token) {
      return false;
    }

    const payload = validateJwt(token, roomId);
    if (!payload) {
      return false;
    }
    return !!room.users.find((usr) => usr.id === payload.sub);
  }
}

export async function buildStatusObject(store) {
  const allRooms = await store.getAllRooms();

  const rooms = Object.values(allRooms).map((room) => ({
    storyCount: room.stories.length,
    userCount: room.users.length,
    userCountDisconnected: room.users.filter((user) => user.disconnected).length,
    lastActivity: room.lastActivity,
    markedForDeletion: room.markedForDeletion,
    created: room.created
  }));

  return {
    rooms,
    roomCount: rooms.length,
    uptime: Math.floor(process.uptime()),
    storeInfo: store.getStoreType()
  };
}

export async function buildRoomExportObject(store, roomId) {
  const room = await store.getRoomById(roomId);
  if (!room) {
    return undefined;
  }

  return {
    roomId: room.id,
    exportedAt: Date.now(),
    stories: room.stories
      .filter((story) => !story.trashed)
      .map((story) => buildStoryExportObject(story, room.users))
  };
}

const buildStoryExportObject = (story, users) => {
  const usernamesMap = users.reduce((total, currentUser) => {
    total[currentUser.id] = currentUser.username || currentUser.id;
    return total;
  }, {});

  return {
    title: story.title,
    description: story.description,
    estimations: Object.entries(story.estimations).map((entry) => {
      const matchingUser = usernamesMap[entry[0]];
      return {username: matchingUser ? matchingUser : entry[0], value: entry[1]};
    })
  };
};

/**
 * This should return the same information as contained in the "joinedRoom" event.
 */
export async function buildRoomStateObject(store, roomId) {
  const room = await store.getRoomById(roomId);
  if (!room) {
    return undefined;
  }
  const {autoReveal, id, selectedStory, stories, users, cardConfig} = room;

  return {
    autoReveal,
    id,
    selectedStory,
    stories,
    users,
    cardConfig: cardConfig ? cardConfig : defaultCardConfig
  };
}
