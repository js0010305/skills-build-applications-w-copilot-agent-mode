import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validObjectId(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^[\da-f]{24}$/i.test(value)) {
    throw httpError(`${field} must be a valid ID`, 400);
  }
  return value;
}

async function mapMongooseInputErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
      throw httpError(error.message, 400);
    }
    throw error;
  }
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError('Activity details are required', 400);
  const userId = validObjectId(input.userId, 'userId');
  const teamId = validObjectId(input.teamId, 'teamId');
  if (typeof input.type !== 'string' || input.type.trim() === '') {
    throw httpError('type is required', 400);
  }
  const type = input.type.trim();
  if (typeof input.minutes !== 'number' || !Number.isFinite(input.minutes) || input.minutes < 1) {
    throw httpError('minutes must be a number greater than zero', 400);
  }
  const minutes = input.minutes;

  return mapMongooseInputErrors(async () => {
    const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
    if (!user || !team) throw httpError('The specified user or team does not exist', 404);
    return Activity.create({
      user: user._id,
      team: team._id,
      type,
      minutes,
      points: minutes,
      occurredAt: new Date(),
    });
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError('Team details are required', 400);
  if (typeof input.name !== 'string' || input.name.trim() === '') {
    throw httpError('name is required', 400);
  }
  if (typeof input.mascot !== 'string' || input.mascot.trim() === '') {
    throw httpError('mascot is required', 400);
  }
  const name = input.name.trim();
  const mascot = input.mascot.trim();
  if (input.members !== undefined && !Array.isArray(input.members)) {
    throw httpError('members must be an array of user IDs', 400);
  }
  const memberIds = [...new Set((input.members ?? []).map((memberId) => validObjectId(memberId, 'member ID')))];

  return mapMongooseInputErrors(async () => {
    const members = memberIds.length === 0 ? [] : await User.find({ _id: { $in: memberIds } }).select('_id');
    if (members.length !== memberIds.length) {
      throw httpError('One or more team members do not exist', 404);
    }
    return Team.create({
      name,
      mascot,
      members: members.map((member) => member._id),
    });
  });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate([{ $group: { _id: '$team', totalPoints: { $sum: '$points' } } }]),
  ]);
  const totalsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totalsByTeam.get(team._id.toString()) ?? 0,
    }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const email = userEmail.trim().toLowerCase();
  if (email === '') throw httpError('A user email is required', 400);
  const user = await User.findOne({ email }).select('_id fitnessGoal').lean();
  if (!user) throw httpError('No user was found for this email', 404);

  const [workouts, recentActivities] = await Promise.all([
    Workout.find().lean(),
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
  ]);
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const activityFocus = recentActivities[0]?.type.trim().toLowerCase();
  const activityToFocus: Record<string, string> = {
    run: 'endurance',
    running: 'endurance',
    cycle: 'endurance',
    cycling: 'endurance',
    walk: 'mobility',
    walking: 'mobility',
  };
  const recentFocus = activityFocus ? activityToFocus[activityFocus] ?? activityFocus : undefined;
  const preferredFocus = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus)
    ? goalFocus
    : recentFocus;

  return workouts
    .sort((left, right) => {
      const leftMatches = left.focus.toLowerCase() === preferredFocus;
      const rightMatches = right.focus.toLowerCase() === preferredFocus;
      return Number(rightMatches) - Number(leftMatches) || (left.title ?? '').localeCompare(right.title ?? '');
    })
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === preferredFocus
        ? workout.focus.toLowerCase() === goalFocus
          ? `Recommended because it matches your ${user.fitnessGoal} fitness goal.`
          : `Recommended based on your recent ${recentActivities[0]?.type} activity.`
        : 'Suggested as another workout option.',
    }));
}

export { User };
