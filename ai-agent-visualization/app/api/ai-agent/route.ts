// app/api/agent/route.js
import { NextResponse } from 'next/server';

// Simulate the AI agent's task execution and event generation
async function* simulateAgentExecution() {
    // Simulate initial planning phase
    await new Promise(resolve => setTimeout(resolve, 500)); // Delay for planning

    yield {
        eventType: "task_created",
        timestamp: new Date().toISOString(),
        taskData: {
            id: "root",
            name: "Process Newsletter Request",
            goal: "Research AI news, write newsletter, send it to mailing list, and make visuals.",
            status: "pending",
            dependencies: [],
            agentDefinition: "Newsletter Processing Agent",
            context: [],
            upcomingTasks: [],
            model: "gpt-4",
            planningSubresults: [],
            executionSubresults: [],
            planSubtasks: [],
            taskResult: {
                type: "",
                content: "",
                childResults: [],
                visualPreviews: [],
                metrics: {},
                details: {}
            },
            taskCreationTime: Date.now(),
            taskStartTime: 0,
            taskEndPlanningTime: 0,
            taskEndExecutionTime: 0,
            taskEndTime: 0,
            expanded: false
        }
    };
    yield {
        eventType: "task_status_change",
        timestamp: new Date().toISOString(),
        taskId: "root",
        status: "planning"
    };

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate planning time

    // Simulate planning completion and subtask creation
    yield {
        eventType: "task_planning_subresults",
        timestamp: new Date().toISOString(),
        taskId: "root",
        subresults: ["task_news_research", "task_newsletter_writing", "task_visuals_creation", "task_mailing_list_management", "task_newsletter_sending"],
    };

    // Simulate creating the subtasks based on the planning result
    await new Promise(resolve => setTimeout(resolve, 200));
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_news_research", name: "News Research Agent", goal: "Research the latest AI news.", status: "pending", parentId: "root", dependencies: [], agentDefinition: "News Research Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_newsletter_writing", name: "Newsletter Writing Agent", goal: "Write a newsletter.", status: "pending", parentId: "root", dependencies: ["task_news_research"], agentDefinition: "Newsletter Writing Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_visuals_creation", name: "Visuals Creation Agent", goal: "Make visuals for the newsletter.", status: "pending", parentId: "root", dependencies: ["task_news_research"], agentDefinition: "Visuals Creation Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_mailing_list_management", name: "Mailing List Management Agent", goal: "Access user's mailing list.", status: "pending", parentId: "root", dependencies: [], agentDefinition: "Mailing List Management Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_newsletter_sending", name: "Newsletter Sending Agent", goal: "Send the newsletter to my mailing list of subscribers.", status: "pending", parentId: "root", dependencies: ["task_newsletter_writing", "task_visuals_creation", "task_mailing_list_management"], agentDefinition: "Newsletter Sending Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };


    yield {
        eventType: "task_status_change",
        timestamp: new Date().toISOString(),
        taskId: "root",
        status: "executing"
    };

    // --- Simulate News Research Branch ---
    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_news_research", status: "planning" };
    await new Promise(resolve => setTimeout(resolve, 800));
    yield {
        eventType: "task_planning_subresults",
        timestamp: new Date().toISOString(),
        taskId: "task_news_research",
        subresults: ["task_keyword_identification", "task_search_query_formulation", "task_search_execution", "task_content_filtering", "task_summary_generation"],
    };
    await new Promise(resolve => setTimeout(resolve, 200));
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_keyword_identification", name: "Keyword Identification Sub-Agent", goal: "Identify relevant keywords for AI news.", parentId: "task_news_research", dependencies: [], agentDefinition: "Keyword Identification Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_search_query_formulation", name: "Search Query Formulation Sub-Agent", goal: "Formulate search queries based on the keywords.", parentId: "task_news_research", dependencies: ["task_keyword_identification"], agentDefinition: "Search Query Formulation Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_search_execution", name: "Search Execution Sub-Agent", goal: "Execute search queries using the search app.", parentId: "task_news_research", dependencies: ["task_search_query_formulation"], agentDefinition: "Search Execution Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_content_filtering", name: "Content Filtering Sub-Agent", goal: "Filter and select relevant articles from the search results.", parentId: "task_news_research", dependencies: ["task_search_execution"], agentDefinition: "Content Filtering Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_summary_generation", name: "Summary Generation Sub-Agent", goal: "Summarize the key information from each selected article.", parentId: "task_news_research", dependencies: ["task_content_filtering"], agentDefinition: "Summary Generation Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_news_research", status: "executing" };

    // Simulate execution of News Research subtasks
    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_keyword_identification", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_keyword_identification",
        result: { 
            type: "keywords", 
            content: ["AI advancements", "machine learning", "deep learning breakthroughs", "AI ethics", "robotics news"],
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_keyword_identification", status: "finished" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_search_query_formulation", status: "waiting for dependencies" }; // Short wait
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_search_query_formulation", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 800));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_search_query_formulation",
        result: { 
            type: "search_queries", 
            content: ["latest AI advancements 2025", "machine learning breakthroughs May 2025", "AI ethics news", "robotics news May 2025"],
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_search_query_formulation", status: "finished" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_search_execution", status: "waiting for dependencies" }; // Short wait
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_search_execution", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate search time
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_search_execution",
        result: { 
            type: "search_results", 
            content: [{ title: "...", url: "...", snippet: "..." }],
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_search_execution", status: "finished" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_filtering", status: "waiting for dependencies" }; // Short wait
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_filtering", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate filtering time
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_content_filtering",
        result: { 
            type: "filtered_articles", 
            content: [{ title: "Relevant Article 1", snippet: "...", content: "..." }],
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_filtering", status: "finished" };


    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_summary_generation", status: "waiting for dependencies" }; // Short wait
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_summary_generation", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate summarization time
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_summary_generation",
        result: { 
            type: "news_summaries", 
            content: "Summary of key AI news...",
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_summary_generation", status: "finished" };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_news_research", status: "finished" }; // News Research is done

    // --- Simulate Mailing List Management Branch (can run in parallel) ---
    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_mailing_list_management", status: "planning" };
    await new Promise(resolve => setTimeout(resolve, 500));
    yield {
        eventType: "task_planning_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_mailing_list_management",
        result: {
            type: "planned_subtasks",
            data: [
                { "id": "task_access_authentication", "name": "Access Authentication Sub-Agent", "goal": "Authenticate access to the user's mailing list.", "dependencies": [] }
            ]
        }
    };
    await new Promise(resolve => setTimeout(resolve, 200));
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_access_authentication", name: "Access Authentication Sub-Agent", goal: "Authenticate access to the user's mailing list.", parentId: "task_mailing_list_management", dependencies: [], agentDefinition: "Access Authentication Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_mailing_list_management", status: "executing" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_access_authentication", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_access_authentication",
        result: { 
            type: "authentication_status", 
            content: { "authenticated": true, "list_handle": "user123_mailing_list" },
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_access_authentication", status: "finished" };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_mailing_list_management", status: "finished" }; // Mailing list management is done

    // --- Simulate Newsletter Writing Branch (Waits for News Research) ---
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit after research finishes
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_writing", status: "waiting for dependencies" };
    await new Promise(resolve => setTimeout(resolve, 100)); // Dependencies met
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_writing", status: "planning" };
    await new Promise(resolve => setTimeout(resolve, 800));
    yield {
        eventType: "task_planning_subresults",
        timestamp: new Date().toISOString(),
        taskId: "task_newsletter_writing",
        subtasks: ["task_content_organization", "task_writing_style_tone", "task_call_to_action"],
    };
    await new Promise(resolve => setTimeout(resolve, 200));
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_content_organization", name: "Content Organization Sub-Agent", goal: "Organize news summaries.", parentId: "task_newsletter_writing", dependencies: [], agentDefinition: "Content Organization Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_writing_style_tone", name: "Writing Style and Tone Sub-Agent", goal: "Ensure engaging style.", parentId: "task_newsletter_writing", dependencies: ["task_content_organization"], agentDefinition: "Writing Style and Tone Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_call_to_action", name: "Call to Action Sub-Agent", goal: "Add calls to action.", parentId: "task_newsletter_writing", dependencies: ["task_writing_style_tone"], agentDefinition: "Call to Action Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_writing", status: "executing" };

    // Simulate execution of Newsletter Writing subtasks
    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_organization", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_content_organization",
        result: { 
            type: "organized_content", 
            content: "Organized newsletter structure...",
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_organization", status: "finished" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_writing_style_tone", status: "waiting for dependencies" };
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_writing_style_tone", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 1200));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_writing_style_tone",
        result: { 
            type: "styled_content", 
            content: "Newsletter content with engaging style...",
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_writing_style_tone", status: "finished" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_call_to_action", status: "waiting for dependencies" };
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_call_to_action", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 800));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_call_to_action",
        result: { 
            type: "final_newsletter_text", 
            content: "Final newsletter text with CTAs...",
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_call_to_action", status: "finished" };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_writing", status: "finished" }; // Newsletter Writing is done

    // --- Simulate Visuals Creation Branch (Waits for News Research) ---
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit after research finishes
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_visuals_creation", status: "waiting for dependencies" };
    await new Promise(resolve => setTimeout(resolve, 100)); // Dependencies met
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_visuals_creation", status: "planning" };
    await new Promise(resolve => setTimeout(resolve, 800));
    yield {
        eventType: "task_planning_subresults",
        timestamp: new Date().toISOString(),
        taskId: "task_visuals_creation",
        subresults: ["task_content_visual_mapping", "task_visuals_generation_sourcing"],
    };
    await new Promise(resolve => setTimeout(resolve, 200));
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_content_visual_mapping", name: "Content-Visual Mapping Sub-Agent", goal: "Determine visual needs.", parentId: "task_visuals_creation", dependencies: [], agentDefinition: "Content-Visual Mapping Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_visuals_generation_sourcing", name: "Visuals Generation/Sourcing Sub-Agent", goal: "Generate or find visuals.", parentId: "task_visuals_creation", dependencies: ["task_content_visual_mapping"], agentDefinition: "Visuals Generation/Sourcing Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_visuals_creation", status: "executing" };

    // Simulate execution of Visuals Creation subtasks
    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_visual_mapping", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 800));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_content_visual_mapping",
        result: { 
            type: "visual_plan", 
            content: "Plan for visuals based on content...",
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_visual_mapping", status: "finished" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_visuals_generation_sourcing", status: "waiting for dependencies" };
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_visuals_generation_sourcing", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate image generation time
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_visuals_generation_sourcing",
        result: { 
            type: "visual_assets", 
            content: [{ url: "/path/to/image1.png" }, { url: "/path/to/image2.gif" }],
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_visuals_generation_sourcing", status: "finished" };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_visuals_creation", status: "finished" }; // Visuals Creation is done


    // --- Simulate Newsletter Sending (Waits for Newsletter, Visuals, Mailing List) ---
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait a bit after dependencies finish
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_sending", status: "waiting for dependencies" };
    await new Promise(resolve => setTimeout(resolve, 100)); // Dependencies met
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_sending", status: "planning" };
    await new Promise(resolve => setTimeout(resolve, 500));
    yield {
        eventType: "task_planning_subresults",
        timestamp: new Date().toISOString(),
        taskId: "task_newsletter_sending",
        subresults: ["task_content_integration", "task_sending_protocol"]
    };
    await new Promise(resolve => setTimeout(resolve, 200));
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_content_integration", name: "Content Integration Sub-Agent", goal: "Combine text and visuals.", parentId: "task_newsletter_sending", dependencies: [], agentDefinition: "Content Integration Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };
    yield { eventType: "task_created", timestamp: new Date().toISOString(), taskData: { id: "task_sending_protocol", name: "Sending Protocol Sub-Agent", goal: "Send newsletter.", parentId: "task_newsletter_sending", dependencies: ["task_content_integration"], agentDefinition: "Sending Protocol Sub-Agent", context: [], upcomingTasks: [], model: "gpt-4", planningSubresults: [], executionSubresults: [], planSubtasks: [], taskResult: { type: "", content: "", childResults: [], visualPreviews: [], metrics: {}, details: {} }, taskCreationTime: Date.now(), taskStartTime: 0, taskEndPlanningTime: 0, taskEndExecutionTime: 0, taskEndTime: 0, expanded: false } };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_sending", status: "executing" };

    // Simulate execution of Newsletter Sending subtasks
    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_integration", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 1000));
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_content_integration",
        result: { 
            type: "integrated_newsletter", 
            content: "HTML content of the final newsletter...",
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_content_integration", status: "finished" };

    await new Promise(resolve => setTimeout(resolve, 500));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_sending_protocol", status: "waiting for dependencies" };
    await new Promise(resolve => setTimeout(resolve, 100));
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_sending_protocol", status: "executing" };
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate sending time
    yield {
        eventType: "task_execution_sub_result",
        timestamp: new Date().toISOString(),
        taskId: "task_sending_protocol",
        result: { 
            type: "sending_status", 
            content: { "success": true, "recipients": 150, "sent_at": new Date().toISOString() },
            childResults: [],
            visualPreviews: [],
            metrics: {},
            details: {}
        }
    };
    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_sending_protocol", status: "finished" };

    yield { eventType: "task_status_change", timestamp: new Date().toISOString(), taskId: "task_newsletter_sending", status: "finished" }; // Newsletter Sending is done


    // --- Main Goal Finished ---
    await new Promise(resolve => setTimeout(resolve, 500));
    yield {
        eventType: "task_status_change",
        timestamp: new Date().toISOString(),
        taskId: "root",
        status: "finished"
    };

}

export async function POST(req) {
    // In a real app, you would parse the request body to get the user's prompt
    // const { prompt } = await req.json();

    // Create a TransformStream to pipe the generator output to the response body
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start the simulated agent execution and stream events
    const agentEvents = simulateAgentExecution();

    // Function to write events to the stream
    const writeEvents = async () => {
        for await (const event of agentEvents) {
            // Convert event object to JSON string and add a newline delimiter
            const eventString = JSON.stringify(event) + '\n';
            await writer.write(encoder.encode(eventString));
        }
        writer.close(); // Close the stream when done
    };

    console.log("writeEvents");
    // Start writing events without blocking the response
    writeEvents().catch(console.error);

    // Return the streaming response
    return new NextResponse(readable, {
        headers: {
            'Content-Type': 'application/json', // Or 'text/event-stream' for SSE
            'Transfer-Encoding': 'chunked',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache, no-transform',
        },
    });
}
