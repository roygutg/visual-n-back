/* ************************************ */
/* Define experimental variables */
/* ************************************ */
// texts
CORRECT_FEEDBACK = `<div class = centerbox><div style="color:green" class = center-text>Correct!</div></div>`
INCORRECT_FEEDBACK = `<div class = centerbox><div style="color:red" class = center-text>Incorrect</div></div>`
TIMEOUT_MSG = `<div class = centerbox><div class = center-text>Please respond faster</div></div>`
TOO_SLOW_ALERT = `Too slow. Please respond to each image <b>before</b> the next shape appears on the screen.`

// task specific variables
var n_0back_test_blocks = 1 // did not exist originally
var n_nback_test_blocks = 2 * n_0back_test_blocks // was 7
var block_len = 5 // number of trials in ech block, was 20
var match_key = 32 // space
var mismatch_key = 40 // down arrow

// stimuli
var objects = [
    "bee.svg",
    "butterfly.svg",
    "elephant.svg",
    "fish.svg",
    "lion.svg",
    "lobster.svg",
    "parrot.svg",
    "pig.svg",
    "tortoise.svg",
    "whale.svg"
]

// globals
var delay = 0 // the "n" in n-back
var trial_i = 0
var block_i = 0
var target = ""
var curr_stim = ""
var deadline = 2000 // starts at 2000ms and adapts to performance
var slideInterval = 0;


/* ************************************ */
/* Define helper functions */

/* ************************************ */
function assessPerformance() {
    /* Function to calculate the "credit_var", which is a boolean used to
    credit individual experiments in expfactory. */
    var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')
    var missed_count = 0
    var trial_count = 0
    var rt_array = []
    var rt = 0

    //record choices participants made
    var choice_counts = {}
    choice_counts[-1] = 0
    choice_counts[32] = 0
    for (var i = 0; i < experiment_data.length; i++) {
        if (experiment_data[i].possible_responses != 'none') {
            trial_count += 1
            rt = experiment_data[i].rt
            key = experiment_data[i].key_press
            choice_counts[key] += 1
            if (rt == -1) {
                missed_count += 1
            } else {
                rt_array.push(rt)
            }
        }
    }
    var missed_percent = missed_count / experiment_data.length

    //calculate average rt
    var avg_rt = rt_array.length > 0 ? math.median(rt_array) : -1

    //calculate whether response distribution is okay
    var responses_ok = true
    Object.keys(choice_counts).forEach(function (key, index) {
        if (choice_counts[key] > trial_count * 0.85) {
            responses_ok = false
        }
    })

    credit_var = (missed_percent < 0.4 && (avg_rt > 200) && responses_ok)
    jsPsych.data.addDataToLastTrial({"credit_var": credit_var})
}


var randomDraw = function (lst, k) {
    // draws k random elements from lst, without replacement
    var lst_copy = [...lst];
    var sample = [];
    var index;

    for (var i = 0; i < k; i++) {
        index = Math.floor(Math.random() * (lst_copy.length));
        sample.push(lst_copy[index]);
        lst_copy.splice(index, 1)
    }

    return k === 1 ? sample[0] : sample
};


// Runs after each test trial: tracks accuracy, updates data, increments trial counter.
var post_test_trial = function (data) {
    var key = data.key_press

    correct = (trial_i < delay) ||  // before n stimuli were shown, correct regardless of key pressed
        (curr_stim === target && key === match_key) || (curr_stim !== target && key === mismatch_key);

    jsPsych.data.addDataToLastTrial({
        correct: correct,
        stim: curr_stim,
        trial_num: trial_i
    })

    return correct;
};

// Sets all block parameter to defaults, increments block counter, updates response deadline if needed
var set_new_block = function () {
    // Check if we need to increase or decrease the response deadline
    var count_timeouts = 0
    var experiment_data = jsPsych.data.getTrialsOfType('poldrack-single-stim')

    function is_in_curr_block(trial) {
        return trial.block_num === block_i;
    }

    var curr_block_data = experiment_data.filter(is_in_curr_block)
    curr_block_data = curr_block_data.slice(delay) // drop first n trials since no response to them is needed
    for (var i = 0; i < curr_block_data.length; ++i) {
        if (curr_block_data[i].rt == -1)
            count_timeouts++;
    }

    // SLOW DOWN
    // If we have more than 7 timeouts (40%)
    //	and deadline is not already 3500ms (max)
    //	then slow it down by 500ms
    if (count_timeouts > 7 && deadline < 3500) deadline += 500

        // SPEED UP
        // If we have fewer than 3 timeouts (10%)
        //	and deadline is not already 2000ms
    //	then speed it up by 500ms
    else if (count_timeouts < 3 && deadline > 2000) deadline -= 500


    // ALERT
    // If we have more than 12 timeouts (60%)
    //	then show an alert
    if (count_timeouts >= 12) $.alertable.alert(TOO_SLOW_ALERT);


    // init new block
    trial_i = 0;
    delay = block_i <= n_0back_test_blocks ? 0 : 2 // during 0-back, block_i is exactly the number of 0-back
    // blocks completed, including practice at block_i==0
    array = genSet(objects, delay)
    block_i++;
}

var update_0back_target = function () {
    target = randomDraw(objects, 1);
};

var update_nback_target = function () {
    if (trial_i >= delay) {
        target = array[trial_i - delay]
    } else {
        target = ""
    }
};

var getStim = function () {
    curr_stim = array[trial_i++]

    return `<div class = centerbox><div class = center-text><div class = svg>
            <img class="img" src="stims/${curr_stim}" style="max-width:150px">
            </div></div></div>`
}

var getDeadline = function () {
    return deadline;
}

var getTarget = function () {
    return target;
}

var getData = function () {
    return {
        trial_id: "stim",
        exp_stage: "test",
        load: delay,
        target: target,
        block_num: block_i,
        stim: curr_stim
    }
}

var getCorrectResponse = function () {
    return curr_stim === target ? match_key : mismatch_key;
}

var get_0back_practice_instructions = function () {
    return `<div class = centerbox>
        <p class = block-title>Fixed Matching Stage – Practice</p>
        <p class = block-text>Let's practice. In this round your target animal is:</p>
        <p class = center-block-text><img src="stims/${target}" style="max-width:200px"></p>
        <p class = block-text>During the practice session you'll get feedback whether you were correct or not after each response.</p>
        <p class = block-text>Press <strong>enter</strong> to continue.</p>
        </div>`
}

var practice_instructions_2back = `<div class = centerbox>
        <p class = block-title>2-Back Matching Stage – Practice</p>
        <p class = block-text>Let's practice. We remind you that you need to indicate whether the one before the last animal is identical to the current one you see.</p>
        <p class = block-text>During the practice session you'll get feedback whether you were correct or not after each response.</p>
        <p class = block-text>Press <strong>enter</strong> to begin.</p>
        </div>`

var get_start_test_instructions = function () {
    stage_name = delay === 0 ? "Fixed Matching Stage" : "2-Back Matching Stage";

    return `<div class = centerbox>
        <p class = block-title>${stage_name} – Instructions</p>
        <p class = block-text>Practice complete, good job!</p>
        <p class = block-text>Note that in the next rounds there will not be any feedback.</p>
        <p class = block-text>It is important that you be <strong>as accurate as you can</strong>, and respond to each image <strong>before the next one appears</strong> on the screen.</p>
        <p class = block-text>Press <strong>enter</strong> to begin.</p>
        </div>`
}


var get_0back_new_block_instructions = function () {
    var curr_0back_test_block = block_i;

    return `<div class = centerbox>
        <p class = block-title>Fixed Matching Stage – Round ${curr_0back_test_block} (of ${n_0back_test_blocks})</p>
        <p class = block-text>This is your target shape in this round:</p>
        <p class = center-block-text><img src="stims/${target}" style="max-width:200px"></p>
        <p class = block-text>You can take a short rest, and begin when you feel ready.</p>
        <p class = block-text>Press <strong>enter</strong> to begin.</p>
        </div>`
}

var get_nback_new_block_instructions = function () {
    // subtract 0-back test blocks and 2-back practice block
    var curr_nback_test_block = block_i - n_0back_test_blocks - 1;

    return `<div class = centerbox>
        <p class = block-title>2-Back Matching Stage – Round ${curr_nback_test_block} (of ${n_nback_test_blocks})</p>
        <p class = block-text>Ready for the next round?</p>
        <p class = block-text>You can take a short rest, and begin when you feel ready.</p>
        <p class = block-text>Press <strong>enter</strong> to begin.</p>
        </div>`
}

// Get a random number between min and max
function getRand(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

//	CNBM = Count N Back Matches, where N is the N-back level
//		helper to genSet (below)
var cnbm = function (stim_arr, n) {
    count_matches = 0;
    for (var i = n; i < stim_arr.length; i++) {
        if (stim_arr[i] == stim_arr[i - n]) {
            count_matches++;
        }
    }
    return count_matches;
}

// Generate a block
function genSet(stimuli, n) {
    n_wanted_targets = 7
    array = [...stimuli]; // (shallow) copy the stimuli array do it's not changed by this function

    // Fill initial array using stimuli one by one. Array length is block_len+n since first n trials cannot be targets
    while (array.length < block_len + n) {
        next_stimulus_idx = array.length % stimuli.length;
        array.push(stimuli[next_stimulus_idx])
    }
    array = jsPsych.randomization.shuffle(array)

    // add targets if there aren't enough:
    if (n === 0) {
        possible_new_target_indices = []
        n_targets = 0
        for (i = 0; i < array.length; i++) {
            if (array[i] === target) {
                n_targets++;
            } else {
                possible_new_target_indices.push(i)
            }
        }
        new_target_indices = randomDraw(possible_new_target_indices, n_wanted_targets - n_targets)
        for (i = 0; i < new_target_indices.length; i++) {
            new_target_idx = new_target_indices[i]
            array[new_target_idx] = target
        }

    } else { // n>0
        // Note: each iteration adds a target but may also ruin an existing one, so there is no guarantee this loop ends
        // with exactly n_wanted_targets targets!
        n_targets = cnbm(array, n)
        for (var n_missing_targets = n_wanted_targets - n_targets; n_missing_targets > 0; n_missing_targets--) {
            new_target_idx = getRand(n, array.length - 1)
            array[new_target_idx] = array[new_target_idx - n]
        }
    }

    return array;
}


// Used to present a demo of the stimulus presentation in instructions
var slides = function () {
    var slides = document.querySelectorAll('#slides .slide');
    var currentSlide = 0;

    function nextSlide() {
        slides[currentSlide].className = 'slide';
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].className = 'slide showing';
    }

    slideInterval = setInterval(nextSlide, 1000);
};


// Initial shuffle
objects = jsPsych.randomization.shuffle(objects)

// Preload all images
if (document.images) {
    for (var i = 0; i < objects.length; i++) {
        window["stims_" + i] = new Image();
        window["stims_" + i].src = "stims/" + objects[i];
    }
    window["instr1"] = new Image();
    window["instr2"] = new Image();
    window["instr3"] = new Image();
    window["instr4"] = new Image();
    window["instr5"] = new Image();
    window["instr1"].src = "imgs/1back_diagram.svg";
    window["instr2"].src = "imgs/1back_diagram_nonmatch.svg";
    window["instr3"].src = "imgs/2back_diagram.svg";
    window["instr4"].src = "imgs/3back_diagram.svg";
    window["instr5"].src = "imgs/arrow_keys.svg";
}

//####################################################
//####################################################


/* ************************************ */
/* Set up jsPsych blocks */
/* ************************************ */

/* define static blocks */
var welcome_text = `Welcome to the "n-back" task. Click the button below to begin.`
var all_stimuli_table = `<table style="width:100%">
                         <tr> <td style="text-align:center;"><img src="stims/${objects[0]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[1]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[2]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[3]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[4]}" style="max-width:150px"></td> </tr>
                         <tr> <td style="text-align:center;"><img src="stims/${objects[5]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[6]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[7]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[8]}" style="max-width:150px"></td>
                              <td style="text-align:center;"><img src="stims/${objects[9]}" style="max-width:150px"></td> </tr>
                         </table>`

general_instructions = `<div class = centerbox>
         <p class = block-title>Instructions</p>
         <p class = block-text> In this task you will animals images one after another. Here are all the possible animals you might see:</p>
         ${all_stimuli_table}
         </div>`

instructions_0back_page1 = `<div class = centerbox>
        <p class = block-title>Fixed Matching Stage – Instructions</p>
        <p class = block-text>For each round in this stage, we will show you a target animal you will need to remember.</p>
        <p class = block-text>Then, you will see a series of animals images, one after another.</p>
        <p class = block-text>Your goal will be to indicate for each image you see whether it is the target animal or not.</p>
        </div>`;

instructions_0back_page2 = `<div class = centerbox>
        <p class = block-title>Fixed Matching Stage – Instructions</p>
        <p class = block-text> Remember, each time an image appears on the screen, your goal is to indicate if it is the target animal or not.</p>
        <p class = block-text>Your job is to respond using the keyboard:</p>
        <p class = center-block-text>press the <span style="color:green"><b>space bar</b></span> if it's a <span style="color:green"><b>match</b></span> <br>
         press the <span style="color:red"><b>down arrow</b></span> key if it's a <span style="color:red"><b>mismatch</b></span></p>
        <p class = block-text>Do your best to stay focused. Too many wrong responses will disqualify you from payment.</p>
        </div>`;

instructions_2back_page1 = `<div class = centerbox>
        <p class = block-title>2-Back Matching Stage – Instructions</p>
        <p class = block-text>Stage 1 complete! Moving on to stage 2.</p>
        <p class = block-text>In stage 2, each time an animal appears on the screen, your goal is to indicate whether it is the same animal that appeared <b>2 images back</b> or not.</p>
        <table style="width:100%"> <tr>
        <td style="text-align:center;"><img src="imgs/2back_diagram.svg" style="max-width:300px"></td>
        <td style="text-align:center;"><img src="imgs/1back_diagram_nonmatch.svg" style="max-width:300px"></td>
        </tr> </table>
        </div>`;

instructions_2back_page2 = `<div class = centerbox>
        <p class = block-title>2-Back Matching Stage – Instructions</p>
        <p class = block-text>As a reminder, here are all possible animals you may see:</p>
        ${all_stimuli_table}
        </div>`;

instructions_2back_page3 = `<script>slides();</script><div class = centerbox>
        <p class = block-title>2-Back Matching Stage – Instructions</p>
        <p class = block-text>The images will be presented one after another in a sequence like the animation below. Can you spot the 2-back matches?</p>
        <ul id="slides"><li class="slide showing"><img src="stims/${objects[1]}" style="max-width:200px"></li>
        <li class="slide"></li> <li class="slide"><img src="stims/${objects[3]}" style="max-width:200px"></li>
        <li class="slide"></li> <li class="slide"><img src="stims/${objects[1]}" style="max-width:200px"></li>
        <li class="slide"></li> <li class="slide"><img src="stims/${objects[2]}" style="max-width:200px"></li>
        <li class="slide"> </ul>
        </div>`;

instructions_2back_page4 = `<script>clearInterval(slideInterval);</script><div class = centerbox>
        <p class = block-title>2-Back Matching Stage – Instructions</p>
        <p class = block-text>Your job is to respond using the keyboard:</p>
        <p class = center-block-text>press the <span style="color:green"><b>space bar</b></span> if it's a <span style="color:green"><b>match</b></span> <br>
        press the <span style="color:red"><b>down arrow</b></span> key if it's a <span style="color:red"><b>mismatch</b></span></p>
        <p class = block-text>No response is needed for the first two animals in each round.</p>
        </div>`

var general_instructions_block = {
    type: 'poldrack-instructions',
    pages: [general_instructions],
    data: {
        trial_id: 'instruction'
    },
    allow_keys: false,
    show_clickable_nav: true,
    timing_post_trial: 1000
};

var practice_instructions_block_0back = {
    type: 'poldrack-instructions',
    pages: [instructions_0back_page1, instructions_0back_page2],
    data: {
        trial_id: 'instruction'
    },
    allow_keys: false,
    show_clickable_nav: true,
    timing_post_trial: 1000
};

var practice_instructions_block_2back = {
    type: 'poldrack-instructions',
    pages: [instructions_2back_page1, instructions_2back_page2, instructions_2back_page3, instructions_2back_page4],
    data: {
        trial_id: 'instruction'
    },
    allow_keys: false,
    show_clickable_nav: true,
    timing_post_trial: 1000
};

// Credit for keyboard vector used in instructions
// Author: Kevin Burke
// https://www.vectorportal.com/StockVectors/Icons/ARROW-KEYS-FREE-VECTOR/9459.aspx

var end_block = {
    type: 'poldrack-text',
    text: `<div class = centerbox><p class = center-block-text>Task completed!</p>
           <p class = center-block-text>Press <strong>enter</strong> to continue the experiment.</p></div>`,
    cont_key: [13],
    data: {
        trial_id: "end",
        exp_id: 'test_n_back'
    },
    timing_response: 180000,
    timing_post_trial: 0,
    on_finish: assessPerformance
};

var start_0back_practice = {
    type: 'poldrack-text',
    text: get_0back_practice_instructions,
    cont_key: [13],
    data: {
        trial_id: "0back-instruction"
    },
    timing_response: 180000,
    timing_post_trial: 1000,
    on_finish: set_new_block
};

var start_2back_practice = {
    type: 'poldrack-text',
    text: practice_instructions_2back,
    cont_key: [13],
    data: {
        trial_id: "2back-instruction"
    },
    timing_response: 180000,
    timing_post_trial: 1000,
    on_finish: set_new_block
};

var start_test_instructions = {
    type: 'poldrack-text',
    text: get_start_test_instructions,
    cont_key: [13],
    data: {
        trial_id: "instruction"
    },
    timing_response: 180000,
    timing_post_trial: 1000
};

var update_0back_target_block = {
    type: 'call-function',
    func: update_0back_target,
    data: {
        trial_id: "update_0back_target"
    },
    timing_post_trial: 0
}

var update_nback_target_block = {
    type: 'call-function',
    func: update_nback_target,
    data: {
        trial_id: "update_nback_target"
    },
    timing_post_trial: 0
}

var start_0back_new_block = {
    type: 'poldrack-text',
    data: {
        exp_stage: "0back-test",
        trial_id: "delay_text"
    },
    text: get_0back_new_block_instructions,
    cont_key: [13],
    timing_response: 900000,
    on_finish: set_new_block
};

var start_nback_new_block = {
    type: 'poldrack-text',
    data: {
        exp_stage: `nback-test`,
        trial_id: "delay_text"
    },
    text: get_nback_new_block_instructions,
    cont_key: [13],
    timing_response: 900000,
    on_finish: set_new_block
};


// ######################################################
// ######################################################

//#######################
// 0-back practice
practice_0back_block = []
for (var i = 0; i < block_len; i++) {
    var practice_0back_trial = {
        type: 'poldrack-categorize',
        is_html: true,
        stimulus: getStim,
        key_answer: getCorrectResponse,
        data: {
            trial_id: "stim",
            exp_stage: "0back-practice",
            stim: curr_stim,
            target: getTarget
        },
        correct_text: CORRECT_FEEDBACK,
        incorrect_text: INCORRECT_FEEDBACK,
        timeout_message: TIMEOUT_MSG,
        timing_feedback_duration: 500,
        show_stim_with_feedback: false,
        response_ends_trial: false,
        choices: [match_key, mismatch_key],
        timing_stim: 500,
        timing_response: deadline,
        timing_post_trial: 500
    };
    practice_0back_block.push(practice_0back_trial)
}


//#######################
// 2-back practice
practice_2back_block = []
for (var i = 0; i < block_len + 2; i++) {
    // starting trial 2 there's a target, feedback can be given
    if (i > 1) {
        correct_text = CORRECT_FEEDBACK;
        incorrect_text = INCORRECT_FEEDBACK;
        timeout_message = TIMEOUT_MSG;
        fb_duration = 500;
    } else {
        // default empty feedback texts if i<=1
        correct_text = "&nbsp;"
        incorrect_text = "&nbsp;"
        timeout_message = "&nbsp;"
        fb_duration = 1; // can't set to 0 because if this evaluates to false it reverts to default
    }

    var practice_2back_trial = {
        type: 'poldrack-categorize',
        is_html: true,
        stimulus: getStim,
        key_answer: getCorrectResponse,
        data: {
            trial_id: "stim",
            exp_stage: "2back-practice",
            stim: curr_stim,
            target: getTarget
        },
        correct_text: correct_text,
        incorrect_text: incorrect_text,
        timeout_message: timeout_message,
        timing_feedback_duration: fb_duration,
        show_stim_with_feedback: false,
        response_ends_trial: false,
        choices: [match_key, mismatch_key],
        timing_stim: 500,
        timing_response: deadline,
        timing_post_trial: 500
    };
    practice_2back_block.push(update_nback_target_block)
    practice_2back_block.push(practice_2back_trial)
}

//#######################
// All other blocks
var test_trial = {
    type: 'poldrack-single-stim',
    is_html: true,
    target: getTarget,
    stimulus: getStim,
    data: getData,
    correct_response: getCorrectResponse,
    choices: [match_key, mismatch_key],
    timing_stim: 500,
    timing_response: getDeadline,
    timing_post_trial: 0,
    on_finish: function (data) {
        post_test_trial(data)
    }
};

var test_0back_block = {
    timeline: [test_trial],
    loop_function: function () {
        return trial_i < block_len;  // trial_i is incremented in test_trial, as part of getStim
    }
}

var test_nback_block = {
    timeline: [update_nback_target_block, test_trial],
    loop_function: function () {
        return trial_i < block_len + delay; // trial_i is incremented in test_trial, as part of getStim
    }
}

//#####################
//# Set up experiment #
//#####################

var adaptive_n_back_experiment = []

// General instructions
adaptive_n_back_experiment.push(general_instructions_block);

// 0-back
// 		Practice
adaptive_n_back_experiment.push(practice_instructions_block_0back)
adaptive_n_back_experiment.push(update_0back_target_block)
adaptive_n_back_experiment.push(start_0back_practice)
adaptive_n_back_experiment = adaptive_n_back_experiment.concat(practice_0back_block)

//      Test
adaptive_n_back_experiment.push(start_test_instructions)
for (var b = 0; b < n_0back_test_blocks; b++) {
    adaptive_n_back_experiment.push(update_0back_target_block)
    adaptive_n_back_experiment.push(start_0back_new_block)
    adaptive_n_back_experiment.push(test_0back_block)
}

// 2-back
// 		Practice
adaptive_n_back_experiment.push(practice_instructions_block_2back)
adaptive_n_back_experiment.push(start_2back_practice)
adaptive_n_back_experiment = adaptive_n_back_experiment.concat(practice_2back_block)

// 		Test
adaptive_n_back_experiment.push(start_test_instructions)
for (var b = 0; b < n_nback_test_blocks; b++) {
    adaptive_n_back_experiment.push(start_nback_new_block)
    adaptive_n_back_experiment.push(test_nback_block)
}

//		End
adaptive_n_back_experiment.push(end_block)


//#################################################################################################
//#################################################################################################
//#################################################################################################
// Inject a CSS and JS file for custom alerts
//		this way we don't have to modify the index.html file
var link = document.createElement("link");
link.href = "css/jquery.alertable.css";
link.type = "text/css";
link.rel = "stylesheet";
document.getElementsByTagName("head")[0].appendChild(link);

var script = document.createElement('script');
script.setAttribute('src', 'js/jquery.alertable.min.js');
script.setAttribute('type', 'text/javascript');
document.getElementsByTagName('head')[0].appendChild(script);
