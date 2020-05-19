import React from 'react';

import Graph from 'vis-react';

import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';

import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import Grid from '@material-ui/core/Grid';

import { Checkbox } from '@material-ui/core';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import TextField from '@material-ui/core/TextField';

import Button from '@material-ui/core/Button';

class Home extends React.Component {
    Home() {

    }

    state = {
        nodes: [
            { id: "A", label: "A" },
            { id: "B", label: "B" },
            { id: "C", label: "C" },
            { id: "D", label: "D" },
            { id: "E", label: "E" }
        ],
        edges: [
            { from: "A", to: "B" },
            { from: "A", to: "C" },
            { from: "B", to: "D" },
            { from: "B", to: "E" }
        ],

        graphRef: null,

        options: {
            autoResize: true,
            layout: {
                hierarchical: false,
            },
            edges: {
                color: "#000000",
                font: {
                    size: 13,
                    color: '#999'
                },
                smooth: {
                    type: "discrete"
                }
            },
            nodes: {
                size: 30,
                shape: 'dot',

                font: {
                    color: '#000',
                    strokeWidth: 5,
                    size: 20,
                },
            },
            physics: {
                enabled: true,
                barnesHut: {
                    gravitationalConstant: -10000,
                    centralGravity: 0.4,
                }
            },

            interaction: {
                navigationButtons: true,
                keyboard: true
            },

            height: "850px",
        },

        modal: {
            open: false,
            type: null
        }

    }

    // MODAL CONTROLS ///////////////////////
    handleOpenAdd = () => {
        this.setState({
            modal: {
                open: true,
                type: "ADD_NODE"
            }
        })
    };

    handleClose = () => {
        this.setState({
            modal: {
                open: false,
                type: null
            }
        })
    };
    // MODAL CONTROLS ///////////////////////

    // GRAPH CONTROLS ///////////////////////
    addNewNode = async () => {
        var error = false

        var name = document.getElementById("newNodeName")
        if (name == null || name.value == "" || name.value.replace(" ", "") == "") {
            document.getElementById("errorNoName").style.display = ""
            error = true

        } else {
            name = name.value
            document.getElementById("errorNoName").style.display = "none"

            var already_exists = false

            for (let node of this.state.nodes) {
                if (node.label == name) {
                    already_exists = true
                    break
                }
            }

            if (already_exists) {
                document.getElementById("errorNameAlreadyExists").style.display = ""
                error = true
            } else {
                document.getElementById("errorNameAlreadyExists").style.display = "none"
            }
        }

        if (!error) {
            var newNodes = []
            for (let node of this.state.nodes) {
                newNodes.push(node)
            }

            newNodes.push({ id: name, label: name }
            )

            await this.setState({
                nodes: newNodes
            })

            await this.state.graphRef.body.emitter.emit('_dataChanged')
            await this.state.graphRef.redraw()

            this.handleClose()
        }

    };

    // MODAL CONTROLS ///////////////////////


    render() {
        var modal = <div></div>
        if (this.state.modal.open) {
            if (this.state.modal.type == "ADD_NODE") {
                modal = <Dialog
                    open={this.state.modal.open}
                    onClose={() => this.handleClose()}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                >
                    <DialogTitle id="alert-dialog-title">{"Add a new Page"}</DialogTitle>
                    <DialogContent style={{ minWidth: "500px" }}>
                        <form autoComplete="off" >
                            <TextField id="newNodeName" label="Page Name" variant="outlined" fullWidth={true} />
                        </form>
                    </DialogContent>

                    <DialogContent>
                        <span style={{ paddingTop: "40px", color: "#f50057", display: "none" }} id="errorNoName">Please specify a name for the new page!</span>
                    </DialogContent>

                    <DialogContent>
                        <span style={{ paddingTop: "40px", color: "#f50057", display: "none" }} id="errorNameAlreadyExists">Sorry, there already exists a page with that name!</span>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={() => this.handleClose()} color="secondary">
                            Cancel
                        </Button>
                        <Button variant="outlined" color="primary" onClick={() => this.addNewNode()}>
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            }

        }

        return (
            <div>
                <div style={{ position: "absolute", top: "0", left: "0", width: "100%", height: "100%" }}>
                    <Graph graph={{ "nodes": this.state.nodes, "edges": this.state.edges }} options={this.state.options} getNetwork={network => {
                        this.setState({ graphRef: network })
                    }} />
                </div>

                <div style={{ position: "fixed", top: "25px", left: "25px" }}>
                    <Card style={{ width: "400px" }}>
                        <CardContent>
                            <h2 style={{ color: "#38393b" }}>Controls</h2>

                            <hr style={{ color: "#38393b", opacity: 0.2 }}></hr>

                            <h4 style={{ color: "#999" }}>Graph</h4>

                            <Grid container spacing={2} style={{ marginTop: "20px" }}>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="primary" style={{ width: "100%" }} onClick={() => this.handleOpenAdd()}>
                                        Add new Page
                                    </Button>
                                </Grid>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="primary" style={{ width: "100%" }}>
                                        Add new Link
                                    </Button>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} style={{ marginTop: "20px" }}>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="secondary" size="medium" style={{ width: "100%" }}>
                                        Remove Page
                                    </Button>
                                </Grid>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="secondary" size="medium" style={{ width: "100%" }}>
                                        Remove Link
                                    </Button>
                                </Grid>
                            </Grid>

                            <div style={{ width: "70%", margin: "auto", marginTop: "20px" }}>
                                <Button variant="outlined" color="primary" style={{ width: "100%" }}>
                                    Generate random graph
                                </Button>
                            </div>

                            <hr style={{ color: "#38393b", opacity: 0.2, marginTop: "20px" }}></hr>

                            <h4 style={{ color: "#999" }}>Random Surfer</h4>

                            <Grid container spacing={2} style={{ marginTop: "20px" }}>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="primary" size="medium" style={{ width: "100%", fontSize: "12px", height: "100%" }}>
                                        Pick Starting Node
                                    </Button>
                                </Grid>

                                <Grid item md={3}>
                                    <Button variant="outlined" color="primary" size="medium" style={{ width: "100%", height: "100%" }}>
                                        <i class="fas fa-play"></i>
                                    </Button>
                                </Grid>

                                <Grid item md={3}>
                                    <Button variant="outlined" color="secondary" size="medium" style={{ width: "100%", height: "100%" }}>
                                        <i class="fas fa-trash"></i>
                                    </Button>
                                </Grid>
                            </Grid>

                            <FormGroup row style={{ marginTop: "20px" }}>
                                <FormControlLabel
                                    control={<Checkbox name="checkedA" />}
                                    label="Solve Dead Ends"
                                />

                                <FormControlLabel
                                    control={<Checkbox name="checkedA" />}
                                    label="Solve Spider Traps"
                                />
                            </FormGroup>


                            <hr style={{ color: "#38393b", opacity: 0.2, marginTop: "20px" }}></hr>

                            <h4 style={{ color: "#999" }}>PageRank</h4>

                            <Grid container spacing={2} style={{ marginTop: "20px" }}>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="primary" style={{ width: "100%" }}>
                                        Table View
                                    </Button>
                                </Grid>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="primary" style={{ width: "100%" }}>
                                        Hyperlink Matrix
                                    </Button>
                                </Grid>
                            </Grid>

                            <FormGroup row style={{ marginTop: "20px" }}>
                                <FormControlLabel
                                    control={<Checkbox name="checkedA" />}
                                    label="Show Dead Ends"
                                />

                                <FormControlLabel
                                    control={<Checkbox name="checkedA" />}
                                    label="Show Spider Traps"
                                />
                            </FormGroup>
                        </CardContent>
                    </Card>
                </div>
                {modal}
            </div>
        )
    }
}


export default Home