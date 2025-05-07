// logic for a task management system

let tasklist = []; //logs all tasks
let customTags = []; //logs all custom tags

let currentStatusFilter = "";
let currentTagFilters = [];
let currentSort = "newest"; // default sort order

function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasklist));
}

function saveTags() {
    localStorage.setItem("tags", JSON.stringify(customTags));
}

function loadTasks() {
    const saved = localStorage.getItem("tasks");
    if (saved) {
      tasklist = JSON.parse(saved);
    }
}

function loadTags() {
    const saved = localStorage.getItem("tags");
    if (saved) {
        customTags = JSON.parse(saved);
    }
}

function checkOverdue(dueDate, currentDatetime) {
    if (!dueDate) return false; // No due date means not overdue
    const due = new Date(dueDate);
    return due < currentDatetime; 
}

function customDateString(dateStr){
    
    const date = new Date(dateStr);
    
    const options = {
        weekday: 'short',   // "Sun"
        month: 'short',     // "May"
        day: '2-digit',     // "04"
        year: 'numeric',    // "2025"
    };
    
    const datePart = date.toLocaleDateString(undefined, options); // "Sun, May 04, 2025"
    const timePart = date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    }); // "9:30 PM"
    
    return `${datePart} at ${timePart}`;
    
}

function addTask(title, dueDate, priority, status = 'open', tags, notes = '') {

    const newTask = {
        title: title,
        dueDate: dueDate,
        priority: priority,
        status: status,
        tags: tags,
        notes: notes,
        dateCreated: Date.now()
    };
    tasklist.push(newTask);
    saveTasks();
    return newTask;
}

function addTag(tag) {
    if (!customTags.includes(tag)) {
        customTags.push(tag);
        saveTags();
    }
    return customTags;
}

function renderCustomTag(tag, tagContainer) {
    const wrapper = document.createElement("div");
    wrapper.className = "tagCheckbox";

    const tagOption = document.createElement("input");
    tagOption.type = "checkbox";
    tagOption.value = tag;
    tagOption.className = "tag_option";

    const label = document.createElement("label");
    label.textContent = ` ${tag}`;
    label.prepend(tagOption);

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.type = "button";
    deleteBtn.style.fontSize = "0.6em";
    deleteBtn.style.color = "#ff3d3d";
    deleteBtn.style.backgroundColor = "#580202";
    deleteBtn.style.border = "none";
    deleteBtn.style.borderRadius = "50%";
    deleteBtn.style.width = "1em";
    deleteBtn.style.height = "1em";
    deleteBtn.style.marginLeft = "4px";
    deleteBtn.style.display = "flex";
    deleteBtn.style.alignItems = "center";
    deleteBtn.style.justifyContent = "center";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.onclick = () => deleteTag(tag);
    

    wrapper.appendChild(label);
    wrapper.appendChild(deleteBtn);
    tagContainer.appendChild(wrapper);
}

function renderCustomTags() {
    const tagContainer = document.getElementById("customTagOptions");
    tagContainer.innerHTML = ""; // Clear existing tags
    customTags.forEach(tag => {
        renderCustomTag(tag, tagContainer);
    });
    return customTags;
}

function renderTask(task, taskDiv) {
    const container = document.createElement("div"); // Create the main flex container
    container.style.display = "flex";
    container.style.fontSize = "large";
    container.style.gap = "16px";
    container.style.flexWrap = "wrap";
  
    // Left section: main task info
    const mainInfo = document.createElement("div");
    mainInfo.style.flex = "2";
  
    //adding the task details
    const lines = [];
    lines.push(`<strong>${task.title + '\n'}</strong>`);
    if (task.dueDate) lines.push(`Due: ${customDateString(task.dueDate)}`);
    lines.push(`Status: ${task.status === "open" ? "To Do" : "Done"}`);
    if (task.tags.length > 0) lines.push(`Tags: ${task.tags.join(", ")}`);
    mainInfo.innerHTML = lines.join("<br>");
    mainInfo.style.padding = "8px";
  
    // Right section: notes (if any)
    if (task.notes) {
      const notesBox = document.createElement("div");
      notesBox.style.flex = "1";
      notesBox.style.fontSize = "medium";
      notesBox.style.backgroundColor = "#f9f9f9";
      notesBox.style.padding = "8px";
      notesBox.style.border = "1px solid #ccc";
      notesBox.innerHTML = `${task.notes}`;
      container.appendChild(notesBox);
    }
  
    container.prepend(mainInfo); // Add left section first

    taskDiv.style.position = "relative"; // allows absolute-positioned children
    taskDiv.appendChild(container);

    if (task.priority) {
        const priorityLabel = document.createElement("div");
        priorityLabel.textContent = `Priority: ${task.priority}`;
        priorityLabel.style.position = "absolute";
        priorityLabel.style.bottom = "8px";
        priorityLabel.style.right = "8px";
        priorityLabel.style.fontSize = "0.9em";
        priorityLabel.style.color = "#666";
        taskDiv.appendChild(priorityLabel);
    }
}
  

function renderTasks(tasks = tasklist) {
    const container = document.getElementById("output");

    if (tasks.length === 0) {
        container.innerHTML = "No tasks found.";
        return;
    }

    container.innerHTML = ""; // clear old output

    const currentDatetime = new Date(); // get current date and time to check for overdue tasks

    tasks.forEach(task => {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task-card"; // optional for styling
      taskDiv.style.border = "1px solid #ccc";
      taskDiv.style.padding = "8px";
      taskDiv.style.marginBottom = "8px";

      if (checkOverdue(task.dueDate, currentDatetime) && task.status === "open") {
        taskDiv.style.backgroundColor = "#ffd8d8"; // red for overdue
      } else {
        taskDiv.style.backgroundColor = (task.status === "closed") ? "#e5e0cb" : "#fff8df";
      }
      
      renderTask(task, taskDiv); // Display Task Details

      // Toggle Status Button
      const toggleBtn = document.createElement("button");
      toggleBtn.textContent = task.status === "open" ? "Mark Done" : "Reopen";
      toggleBtn.onclick = () => {
        updateStatus(task.dateCreated, task.status === "open" ? "closed" : "open");
      };
  
      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.marginLeft = "8px";
      deleteBtn.onclick = () => {
        deleteTask(task.dateCreated);
      };
  
      taskDiv.appendChild(toggleBtn);
      taskDiv.appendChild(deleteBtn);
      container.appendChild(taskDiv);
    });
}

function renderDefaultTagFilters() {
    const defaultTagFilters = document.getElementById("tagFilters");
    defaultTagFilters.innerHTML = ""; // Clear existing options
    const defaultTags = ["meeting", "assignment", "event", "chore", "virtual"];
    defaultTags.forEach(tag => {
        const tagOption = document.createElement("div");
        tagOption.style.display = "inline-flex";
        tagOption.style.marginRight = "8px";
        tagOption.style.alignItems = "center";
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        checkbox.className = "tag_option";
        checkbox.checked = currentTagFilters.includes(tag);
        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                currentTagFilters.push(tag);
            } else {
                currentTagFilters = currentTagFilters.filter(t => t !== tag);
            }
            applyFiltersAndSort();
        });
        const label = document.createElement("label");
        label.textContent = ` ${tag}`;
        label.prepend(checkbox);
        tagOption.appendChild(label);
        defaultTagFilters.appendChild(tagOption);
    });
    return defaultTags;
}

function renderTagFilters() {

    renderDefaultTagFilters();


    const tagFilterOptions = document.getElementById("customTagFilters");
    tagFilterOptions.innerHTML = ""; // Clear existing options
    customTags.forEach(tag => {
        const tagOption = document.createElement("div");
        tagOption.style.display = "inline-flex";
        tagOption.style.marginRight = "8px";
        tagOption.style.alignItems = "center";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = tag;
        
        checkbox.checked = currentTagFilters.includes(tag);

        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                currentTagFilters.push(tag);
            } else {
                currentTagFilters = currentTagFilters.filter(t => t !== tag);
            }
            applyFiltersAndSort();
        });
        const label = document.createElement("label");
        label.textContent = ` ${tag}`;
        label.prepend(checkbox);
        tagOption.appendChild(label);

        tagFilterOptions.appendChild(tagOption);
    });
    return customTags;
}
  

function updateStatus(dateCreated, newStatus) {
    const newTasks = tasklist.map(task => {
        if (task.dateCreated === dateCreated) {
            return { ...task, status: newStatus };
        }
        return task;
    }
    );
    tasklist = newTasks; // Update the tasklist with the new array
    applyFiltersAndSort(); // Reapply filters and sorting
    saveTasks(); // Save the updated tasklist to local storage
    return newTasks;
}
    
function filterByStatus(tasks = tasklist, status = currentStatusFilter) {
    return [...tasks].filter(task => task.status === status);
}

// Filter tasks by selected tags. only returns tasks that have all the selected tags
function filterByTags(tasks = tasklist, tagFilters = currentTagFilters) {
    if (tagFilters.length === 0) return tasks; // No tags selected, return all tasks
    return [...tasks].filter(task => tagFilters.every(tag => task.tags.includes(tag)));
}



function sortTasks(criteria, tasks = tasklist) {

    const priorityOrder = {"": 0, "low": 1, "medium": 2, "high": 3};
    
    const sortedTasks = [...tasks].sort((a, b) => {
        if (criteria === "dueDate") {
            //if the date is empty, we want to put it at the end of the list
            if (!a.dueDate && !b.dueDate) return 0;
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate) - new Date(b.dueDate);
        } else if (criteria === "priority") {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (criteria === "title") {
            return a.title.localeCompare(b.title);
        } else {
            return b.dateCreated - a.dateCreated; // default to dateCreated
        }
    });

    return sortedTasks;
}

function applyFiltersAndSort() {
    let filtered = (currentStatusFilter === "open" || currentStatusFilter === "closed") ? filterByStatus(tasklist, currentStatusFilter) : tasklist;
    filtered = filterByTags(filtered, currentTagFilters);
    let sorted = sortTasks(currentSort, filtered);
    renderTasks(sorted);
    return sorted;
}
  

function countTags() {
    return tasklist.reduce((counts, task) => {
        task.tags.forEach(tag => {
            counts[tag] = (counts[tag] || 0) + 1;
        });
        return counts; 
    }, {});
}

function deleteTask(dateCreated) {
    const newTasks = tasklist.filter(task => task.dateCreated !== dateCreated);
    tasklist = newTasks; 
    applyFiltersAndSort(); // Reapply filters and sorting
    saveTasks(); 
    return newTasks;
}

function deleteTag(tag) {
    customTags = customTags.filter(t => t !== tag);
    saveTags();
    renderCustomTags();
    return customTags;
}

function clearTasks() {
    tasklist = [];
    currentStatusFilter = "";
    currentTagFilters = [];
    currentSort = "newest";
    document.getElementById("filter").value = "";
    document.getElementById("tagFilters").innerHTML = ""; // Clear tag filters
    document.getElementById("sortOrder").value = "";
    renderTasks();
    saveTasks();
    return tasklist;
}



// DOM handlers // 
window.addEventListener("DOMContentLoaded", () => {
    loadTasks();
    loadTags();
    applyFiltersAndSort(); // or renderTasks()
    renderCustomTags();
  });

//handles the form submission
document.getElementById("addTaskForm").addEventListener("submit", (e) => {
    
    e.preventDefault();

    const title = document.getElementById("title").value;
    const dueDate = document.getElementById("dueDate").value;
    const priority = document.getElementById("priority").value;
    const notes = document.getElementById("notes").value;
    const tags = Array.from(document.querySelectorAll("input.tag_option:checked")).map(tag => tag.value);
  
    addTask(title, dueDate, priority, 'open', tags, notes);
    applyFiltersAndSort();
  
    document.getElementById("addTaskForm").reset();
});

//handles the add tag button
document.getElementById("addTagBtn").addEventListener("click", () => {
    const tagInput = document.getElementById("newTagInput");
    const tagValue = tagInput.value.trim();

    if (tagValue && !customTags.includes(tagValue)) {
        addTag(tagValue);
        renderCustomTags();
        tagInput.value = ""; // Clear the input field
    }
});

//handles the filter change
document.getElementById("filter").addEventListener("change", (e) => {
    currentStatusFilter = e.target.value;
    applyFiltersAndSort();
});

//handles the sort change
document.getElementById("sortOrder").addEventListener("change", (e) => {
    currentSort = e.target.value;
    applyFiltersAndSort();
});

//handles the clear tasks button
document.getElementById("clearTasksBtn").addEventListener("click", () => {
    clearTasks();
    saveTasks();
    applyFiltersAndSort();
});

//handles the tag filter button
document.getElementById("openTagModalBtn").addEventListener("click", () => {
    document.getElementById("tagModal").style.display = "block";
    renderTagFilters();
});

//handles the close tag modal button
document.getElementById("closeTagModalBtn").addEventListener("click", () => {
    document.getElementById("tagModal").style.display = "none";
});

//handles the clear tag filters button
document.getElementById("clearTagFiltersBtn").addEventListener("click", () => {
    currentTagFilters = [];
    const checkboxes = document.querySelectorAll("input.tag_option");
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    applyFiltersAndSort();
    renderTagFilters();
});
  