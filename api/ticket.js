export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN } = process.env;
  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

  const { projectKey, issueTypeId, summary, description, priority, assignee } = req.body;

  const issueData = {
    fields: {
      project: { key: projectKey },
      summary,
      description,
      issuetype: { id: issueTypeId },
      priority: { name: priority },
      ...(assignee ? { assignee: { name: assignee } } : {})
    }
  };

  const response = await fetch(`https://${JIRA_DOMAIN}/rest/api/3/issue`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(issueData)
  });

  const result = await response.json();
  res.status(response.status).json(result);
}
