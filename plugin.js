const domain = import.meta.env.VITE_JIRA_DOMAIN || process.env.JIRA_DOMAIN;
const email = import.meta.env.VITE_JIRA_EMAIL || process.env.JIRA_EMAIL;
const token = import.meta.env.VITE_JIRA_API_TOKEN || process.env.JIRA_API_TOKEN;
const authHeader = "Basic " + btoa(`${email}:${token}`);

// Load projects
window.onload = () => {
  fetch(`https://${domain}/rest/api/3/project`, {
    headers: { Authorization: authHeader, Accept: "application/json" }
  })
  .then(res => res.json())
  .then(projects => {
    const select = document.getElementById("projectSelect");
    projects.forEach(project => {
      const option = document.createElement("option");
      option.value = project.id;
      option.text = project.name;
      option.dataset.key = project.key;
      select.appendChild(option);
    });

    loadIssueTypes(projects[0].id);
  });

  document.getElementById("projectSelect").addEventListener("change", (e) => {
    loadIssueTypes(e.target.value);
  });
};

function loadIssueTypes(projectId) {
  const select = document.getElementById("issueTypeSelect");
  select.innerHTML = "";

  fetch(`https://${domain}/rest/api/3/issuetype/project?projectId=${projectId}`, {
    headers: { Authorization: authHeader, Accept: "application/json" }
  })
  .then(res => res.json())
  .then(data => {
    data.issueTypes.forEach(type => {
      const option = document.createElement("option");
      option.value = type.id;
      option.text = type.name;
      select.appendChild(option);
    });
  });
}

async function submitToJira() {
  const projectEl = document.getElementById("projectSelect");
  const issueTypeEl = document.getElementById("issueTypeSelect");

  const projectKey = projectEl.options[projectEl.selectedIndex].dataset.key;
  const issueTypeId = issueTypeEl.value;

  const payload = {
    fields: {
      project: { key: projectKey },
      summary: document.getElementById("summary").value,
      description: document.getElementById("description").value,
      issuetype: { id: issueTypeId },
      priority: { name: document.getElementById("priority").value },
    }
  };

  const assignee = document.getElementById("assignee").value;
  if (assignee) payload.fields.assignee = { name: assignee };

  try {
    const res = await fetch(`https://${domain}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    if (!res.ok) throw json;

    const issueKey = json.key;

    // Upload attachments
    const files = document.getElementById("attachments").files;
    if (files.length) {
      const formData = new FormData();
      for (const file of files) formData.append("file", file);

      await fetch(`https://${domain}/rest/api/3/issue/${issueKey}/attachments`, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "X-Atlassian-Token": "no-check"
        },
        body: formData
      });
    }

    alert(`Ticket ${issueKey} created successfully`);
  } catch (err) {
    console.error("Jira error:", err);
    alert("Something went wrong creating the ticket.");
  }
}
