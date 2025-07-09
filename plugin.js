document.addEventListener("DOMContentLoaded", () => {
  const projectKeySelect = document.getElementById("projectKey");
  const issueTypeSelect = document.getElementById("issueType");
  const submitBtn = document.getElementById("submitBtn");

  const jiraEmail = import.meta.env.VITE_JIRA_EMAIL || process.env.JIRA_EMAIL;
  const jiraToken = import.meta.env.VITE_JIRA_API_TOKEN || process.env.JIRA_API_TOKEN;
  const jiraDomain = import.meta.env.VITE_JIRA_DOMAIN || process.env.JIRA_DOMAIN;

  const authHeader = "Basic " + btoa(`${jiraEmail}:${jiraToken}`);

  // Fetch projects on load
  fetch(`https://${jiraDomain}/rest/api/3/project`, {
    method: "GET",
    headers: {
      "Authorization": authHeader,
      "Accept": "application/json"
    }
  })
  .then(response => response.json())
  .then(projects => {
    projects.forEach(project => {
      const option = document.createElement("option");
      option.value = project.key;
      option.textContent = `${project.name} (${project.key})`;
      projectKeySelect.appendChild(option);
    });
  })
  .catch(err => {
    console.error("Error fetching Jira projects:", err);
    alert("Failed to load Jira projects. Check your credentials.");
  });

  // Load issue types when project selected
  projectKeySelect.addEventListener("change", (e) => {
    const projectKey = e.target.value;
    issueTypeSelect.innerHTML = ""; // Clear old options

    fetch(`https://${jiraDomain}/rest/api/3/issuetype/project?projectId=${projectKey}`, {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Accept": "application/json"
      }
    })
    .then(response => response.json())
    .then(data => {
      if (!data.issueTypes || !data.issueTypes.length) {
        throw new Error("No issue types found for this project.");
      }
      data.issueTypes.forEach(type => {
        const option = document.createElement("option");
        option.value = type.name;
        option.textContent = type.name;
        issueTypeSelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Error fetching issue types:", err);
      alert("Failed to load issue types for selected project.");
    });
  });

  // Submit handler
  submitBtn.addEventListener("click", async () => {
    const projectKey = projectKeySelect.value;
    const issueType = issueTypeSelect.value;
    const summary = document.getElementById("summary").value;
    const description = document.getElementById("description").value;
    const priority = document.getElementById("priority").value;
    const assignee = document.getElementById("assignee").value;
    const attachments = document.getElementById("attachments").files;

    const createIssuePayload = {
      fields: {
        project: { key: projectKey },
        summary,
        description,
        issuetype: { name: issueType },
        priority: { name: priority },
        ...(assignee ? { assignee: { name: assignee } } : {})
      }
    };

    try {
      const issueRes = await fetch(`https://${jiraDomain}/rest/api/3/issue`, {
        method: "POST",
        headers: {
          "Authorization": authHeader,
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(createIssuePayload)
      });

      const issueData = await issueRes.json();

      if (!issueRes.ok) throw issueData;

      const issueKey = issueData.key;

      // Upload attachments
      if (attachments.length > 0) {
        const formData = new FormData();
        for (let file of attachments) {
          formData.append("file", file);
        }

        const uploadRes = await fetch(`https://${jiraDomain}/rest/api/3/issue/${issueKey}/attachments`, {
          method: "POST",
          headers: {
            "Authorization": authHeader,
            "X-Atlassian-Token": "no-check"
          },
          body: formData
        });

        if (!uploadRes.ok) throw await uploadRes.json();
      }

      alert(`Ticket ${issueKey} created successfully.`);
    } catch (err) {
      console.error("Error submitting Jira ticket:", err);
      alert("Failed to create Jira ticket. See console for details.");
    }
  });
});
