import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  timeout: 10000
});

export async function getDashboardOverview() {
  const res = await api.get('/dashboard/overview');
  return res.data.data;
}

export async function getCampaigns() {
  const res = await api.get('/campaigns');
  return res.data.data;
}

export async function getProspects() {
  const res = await api.get('/prospects');
  return res.data.data;
}

export async function getAnalyticsOverview() {
  const res = await api.get('/analytics/overview');
  return res.data.data;
}

export async function getCalls() {
  const res = await api.get('/calls');
  return res.data.data;
}

export async function getApprovals() {
  const res = await api.get('/approvals');
  return res.data.data;
}

export async function getEscalations() {
  const res = await api.get('/escalations');
  return res.data.data;
}

export async function getAgents() {
  const res = await api.get('/agents');
  return res.data.data;
}

export async function getKnowledge() {
  const res = await api.get('/knowledge');
  return res.data.data;
}

export async function getConversations() {
  const res = await api.get('/conversations');
  return res.data.data;
}

export async function callProspect(prospectId) {
  const res = await api.post(`/prospects/${prospectId}/call`);
  return res.data.data;
}
