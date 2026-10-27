#!/usr/bin/env node
/**
 * Moves GitHub Projects v2 issue card to the Ready column.
 * Usage: GITHUB_TOKEN=ghp_xxx node .github/scripts/move-to-ready.mjs
 *
 * Requires a classic PAT with `project` scope:
 *   https://github.com/settings/tokens/new
 */

const OWNER = "cchandrakanth";
const PROJECT_NUMBER = 6;
const ISSUE_NUMBER = 7;
const TARGET_COLUMN = "Ready"; // change to "In review" or "Done" if needed

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("❌ GITHUB_TOKEN env var is not set.");
  console.error("   Create a classic PAT at https://github.com/settings/tokens/new");
  console.error("   with the `project` scope, then run:");
  console.error("   GITHUB_TOKEN=ghp_xxx node .github/scripts/move-to-ready.mjs");
  process.exit(1);
}

async function gql(query, variables = {}) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join("\n"));
  }
  return json.data;
}

// 1. Fetch the project, its Status field options, and find the item for the issue
const { user } = await gql(`
  query($login: String!, $number: Int!) {
    user(login: $login) {
      projectV2(number: $number) {
        id
        fields(first: 20) {
          nodes {
            ... on ProjectV2SingleSelectField {
              id
              name
              options { id name }
            }
          }
        }
        items(first: 100) {
          nodes {
            id
            content {
              ... on Issue { number title }
            }
          }
        }
      }
    }
  }
`, { login: OWNER, number: PROJECT_NUMBER });

const project = user.projectV2;

const item = project.items.nodes.find((n) => n.content?.number === ISSUE_NUMBER);
if (!item) {
  console.error(`❌ Issue #${ISSUE_NUMBER} not found in project #${PROJECT_NUMBER}`);
  console.error("   Make sure the issue is added to the project board.");
  process.exit(1);
}

const statusField = project.fields.nodes.find((f) => f.name === "Status");
if (!statusField) {
  console.error("❌ Could not find a 'Status' single-select field on the project.");
  process.exit(1);
}

const option = statusField.options.find((o) => o.name === TARGET_COLUMN);
if (!option) {
  const available = statusField.options.map((o) => o.name).join(", ");
  console.error(`❌ Column "${TARGET_COLUMN}" not found. Available: ${available}`);
  process.exit(1);
}

console.log(`📋 Project ID:     ${project.id}`);
console.log(`🔖 Item ID:        ${item.id}  (Issue #${ISSUE_NUMBER}: ${item.content.title})`);
console.log(`📊 Status field:   ${statusField.id}`);
console.log(`📌 Target option:  ${option.id}  (${option.name})`);

// 2. Move the card
await gql(`
  mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $project
      itemId: $item
      fieldId: $field
      value: { singleSelectOptionId: $option }
    }) {
      projectV2Item { id }
    }
  }
`, {
  project: project.id,
  item: item.id,
  field: statusField.id,
  option: option.id,
});

console.log(`\n✅ Issue #${ISSUE_NUMBER} moved to "${TARGET_COLUMN}" on Projects board #${PROJECT_NUMBER}`);
