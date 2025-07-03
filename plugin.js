const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_DOMAIN = process.env.JIRA_DOMAIN;

document.getElementById('jira-form').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  // Build issue payload
  const fields = {
    project: { key: form.project.value },
    summary: form.summary.value,
    description: form.description.value,
    issuetype: { name: form.issuetype.value },
    priority: { name: form.priority.value }
  };
  if (form.assignee.value) fields.assignee = { name: form.assignee.value };

  const res = await fetch(`https://${JIRA_DOMAIN}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + btoa(`${JIRA_EMAIL}:${JIRA_TOKEN}`)
    },
    body: JSON.stringify({ fields })
  });
  const issue = await res.json();

  // Upload attachments
  const files = form.attachments.files;
  if (files.length) {
    const formData = new FormData();
    for (const f of files) formData.append('file', f);
    await fetch(`https://${JIRA_DOMAIN}/rest/api/3/issue/${issue.key}/attachments`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${JIRA_EMAIL}:${JIRA_TOKEN}`),
        "X-Atlassian-Token": "no-check"
      },
      body: formData
    });
  }

  document.getElementById('result').innerHTML =
    `<p>✅ Created: <a href="https://${JIRA_DOMAIN}/browse/${issue.key}" target="_blank">${issue.key}</a></p>`;
};
