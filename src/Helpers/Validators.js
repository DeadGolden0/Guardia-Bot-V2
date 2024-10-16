const Project = require('@Database/schemas/Project');
const logger = require('@Helpers/Logger');

/**
 * Checks if the user is the leader of an active project
 * @param {string} userId - ID of the user to check
 * @returns {Promise<{project: Object, isLeader: boolean}>}
 */
async function isProjectLeader(userId) {
    const project = await Project.findOne({ leaderId: userId, status: 'active' });
    if (!project) {
        return { project: null, isLeader: false };
    }
    return { project, isLeader: true };
}

/**
 * Checks if the user is a member of an active project
 * @param {string} userId - ID of the user to check
 * @returns {Promise<{project: Object, isMember: boolean}>}
 */
async function isProjectMember(userId) {
    const project = await Project.findOne({ memberIds: userId, status: 'active' });
    if (!project) {
        return { project: null, isMember: false };
    }
    return { project, isMember: true };
}

/**
 * Checks if a specific user is part of a project
 * @param {string} projectId - ID of the project
 * @param {string} memberId - ID of the member to check
 * @returns {Promise<boolean>}
 */
async function isMemberInProject(projectId, memberId) {
    const project = await Project.findById(projectId);
    if (!project) {
        return false;
    }
    return project.memberIds.includes(memberId);
}

/**
 * Checks if a project exists with a specific group number
 * @param {number} groupeNumber - Group number of the project
 * @returns {Promise<{project: Object, exists: boolean}>}
 */
async function projectExists(groupeNumber) {
    const project = await Project.findOne({ groupeNumber, status: 'active' });
    if (!project) {
        return { project: null, exists: false };
    }
    return { project, exists: true };
}

/**
 * Checks if the group number is unique (i.e., there is no active project with this number).
 * @param {number} groupeNumber - The group number to check
 * @returns {Promise<boolean>} - Returns `true` if the number is unique (no active project with this number), otherwise `false`
 */
async function isGroupNumberUnique(groupeNumber) {
    try {
      const existingProject = await Project.findOne({ groupeNumber, status: 'active' });
  
      // Si aucun projet actif avec ce numéro, renvoie true (c'est unique)
      if (!existingProject) {
        return true;
      }
  
      // Si un projet actif existe déjà avec ce numéro, renvoie false
      return false;
    } catch (error) {
      console.error(`[VALIDATOR ERROR] Erreur lors de la vérification du groupe: ${error.message}`);
      throw new Error("Erreur lors de la vérification du numéro de groupe.");
    }
  }

module.exports = { isProjectLeader, isProjectMember, isMemberInProject, projectExists, isGroupNumberUnique };
