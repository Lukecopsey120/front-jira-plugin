window.onload = () => {
  fetch("/api/projects")
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

  fetch(`/api/issuetypes?projectId=${projectId}`)
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

function submitToJira() {
  const projectEl = document.getElementById("projectSelect");
  const issueTypeEl = document.getElementById("issueTypeSelect");

  const projectKey = projectEl.options[projectEl.selectedIndex].dataset.key;
  const issueTypeId = issueTypeEl.value;

  const body = {
    projectKey,
    issueTypeId,
    summary: document.getElementById("summary").value,
    description: document.getElementById("description").value,
    priority: document.getElementById("priority").value,
    assignee: document.getElementById("assignee").value
  };

  fetch("/api/ticket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      if (data.key) {
        alert(`Ticket ${data.key} created successfully!`);
      } else {
        alert("Failed to create ticket.");
        console.error(data);
      }
    });
}
