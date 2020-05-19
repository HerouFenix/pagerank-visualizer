import React from 'react';

import Graph from 'vis-react';

import Select from 'react-select';

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
import { withStyles } from '@material-ui/styles';

import Button from '@material-ui/core/Button';

const styles = theme => ({ root: { overflow: 'visible' } });

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

        selects: {
            nodes: [
                { value: "A", label: "A" },
                { value: "B", label: "B" },
                { value: "C", label: "C" },
                { value: "D", label: "D" },
                { value: "E", label: "E" }
            ],
            edges: [
                { value: "A B", label: "A -> B" },
                { value: "A C", label: "A -> C" },
                { value: "B D", label: "B -> D" },
                { value: "B E", label: "B -> E" }
            ],
        },

        graphRef: null,

        newLink: {
            from: null,
            to: null
        },

        deleteLink: null,
        deletePage: null,

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

    handleOpenAddLink = () => {
        this.setState({
            modal: {
                open: true,
                type: "ADD_LINK"
            }
        })
    };

    handleOpenDeleteLink = () => {
        this.setState({
            modal: {
                open: true,
                type: "REMOVE_LINK"
            }
        })
    };

    handleOpenDeleteNode = () => {
        this.setState({
            modal: {
                open: true,
                type: "REMOVE_NODE"
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

    // SELECT CONTROLS ///////////////////////
    changeNewFromPage = async (selectedOption) => {
        if (selectedOption != null) {
            await this.setState({ newLink: { from: selectedOption, to: this.state.newLink.to } });

        } else {
            await this.setState({ newLink: { from: null, to: this.state.newLink.to } });
        }
    }

    changeNewToPage = async (selectedOption) => {
        if (selectedOption != null) {
            await this.setState({ newLink: { from: this.state.newLink.from, to: selectedOption } });

        } else {
            await this.setState({ newLink: { from: this.state.newLink.from, to: null } });
        }
    }

    changeDeleteLink = async (selectedOption) => {
        if (selectedOption != null) {
            await this.setState({ deleteLink: selectedOption });

        } else {
            await this.setState({ deleteLink: null });
        }
    }

    changeDeleteNode = async (selectedOption) => {
        if (selectedOption != null) {
            await this.setState({ deletePage: selectedOption });

        } else {
            await this.setState({ deletePage: null });
        }
    }

    // SELECT CONTROLS ///////////////////////


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
            name.replace(" ", "_")

            var newNodes = []
            for (let node of this.state.nodes) {
                newNodes.push(node)
            }

            newNodes.push({ id: name, label: name }
            )

            var selectNewNodes = this.state.selects.nodes
            selectNewNodes.push({ value: name, label: name })

            await this.setState({
                nodes: newNodes,
                selects: {
                    nodes: selectNewNodes,
                    edges: this.state.selects.edges
                },
            })

            await this.state.graphRef.body.emitter.emit('_dataChanged')
            await this.state.graphRef.redraw()

            this.handleClose()
        }

    };

    addNewLink = async () => {
        var error = false

        var from = this.state.newLink.from
        var to = this.state.newLink.to

        if (from == null || from.value == "" || to == null || to.value == "") {
            document.getElementById("errorNoLink").style.display = ""
            error = true

        } else {
            from = from.value
            to = to.value

            document.getElementById("errorNoLink").style.display = "none"

            if (from == to) {
                document.getElementById("errorLinkSameNode").style.display = ""
                error = true
            } else {
                var already_exists = false

                for (let relation of this.state.edges) {
                    if (relation.from == from && relation.to == to) {
                        already_exists = true
                        break
                    }
                }

                if (already_exists) {
                    document.getElementById("errorLinkAlreadyExists").style.display = ""
                    error = true
                } else {
                    document.getElementById("errorLinkAlreadyExists").style.display = "none"
                }
            }

        }

        if (!error) {
            var newLinks = []
            for (let relation of this.state.edges) {
                newLinks.push(relation)
            }

            newLinks.push({ from: from, to: to }
            )

            var selectNewLinks = this.state.selects.edges
            selectNewLinks.push({ value: from + " " + to, label: from + " -> " + to })

            await this.setState({
                edges: newLinks,
                selects: {
                    nodes: this.state.selects.nodes,
                    edges: selectNewLinks
                },
                newLink: {
                    from: null,
                    to: null
                }
            })

            await this.state.graphRef.body.emitter.emit('_dataChanged')
            await this.state.graphRef.redraw()

            this.handleClose()
        }

    };

    removeLink = async () => {
        var error = false

        var link = this.state.deleteLink

        if (link == null || link.value == "") {
            document.getElementById("errorNoDeleteLink").style.display = ""
            error = true

        } else {
            link = link.value
            document.getElementById("errorNoDeleteLink").style.display = "none"
        }

        if (!error) {
            var newLinks = []
            var from = link.split(" ")[0]
            var to = link.split(" ")[1]

            for (let relation of this.state.edges) {
                if (relation.from == from && relation.to == to) {
                    continue
                } else {
                    newLinks.push(relation)
                }
            }

            var selectNewLinks = []
            for (let relation of this.state.selects.edges) {
                if (relation.value.split(" ")[0] == from && relation.value.split(" ")[1] == to) {
                    continue
                } else {
                    selectNewLinks.push(relation)
                }
            }

            await this.setState({
                edges: newLinks,
                selects: {
                    nodes: this.state.selects.nodes,
                    edges: selectNewLinks
                },
                deleteLink: null
            })

            await this.state.graphRef.body.emitter.emit('_dataChanged')
            await this.state.graphRef.redraw()

            this.handleClose()
        }

    };

    removePage = async () => {
        var error = false

        var page = this.state.deletePage

        if (page == null || page.value == "") {
            document.getElementById("errorNoDeletePage").style.display = ""
            error = true

        } else {
            page = page.value
            document.getElementById("errorNoDeletePage").style.display = "none"
        }

        if (!error) {
            var newPages = []

            for (let node of this.state.nodes) {
                if (node.id == page) {
                    continue
                } else {
                    newPages.push(node)
                }
            }

            var selectNewNodes = []
            for (let node of this.state.selects.nodes) {
                if (node.value == page) {
                    continue
                } else {
                    selectNewNodes.push(node)
                }
            }

            var newLinks = []
            for (let relation of this.state.edges) {
                if (relation.from == page || relation.to == page) {
                    continue
                } else {
                    newLinks.push(relation)
                }
            }

            var selectNewLinks = []
            for (let relation of this.state.selects.edges) {
                if (relation.value.split(" ")[0] == page || relation.value.split(" ")[1] == page) {
                    continue
                } else {
                    selectNewLinks.push(relation)
                }
            }

            await this.setState({
                nodes: newPages,
                edges: newLinks,
                selects: {
                    nodes: selectNewNodes,
                    edges: selectNewLinks
                },
                deletePage: null
            })

            await this.state.graphRef.body.emitter.emit('_dataChanged')
            await this.state.graphRef.redraw()

            this.handleClose()
        }

    };

    // GRAPH CONTROLS ///////////////////////


    // PAGERANK COMPUTATIONS ///////////////////////

    // PAGERANK COMPUTATIONS ///////////////////////


    render() {
        const { classes } = this.props;

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

            else if (this.state.modal.type == "ADD_LINK") {
                modal = <Dialog
                    open={this.state.modal.open}
                    onClose={() => this.handleClose()}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    classes={{ paperScrollPaper: classes.root }}
                >
                    <DialogTitle id="alert-dialog-title">{"Add a new Link"}</DialogTitle>
                    <DialogContent className={classes.root} style={{ minWidth: "500px" }}>
                        <h4 style={{ color: "#999" }}>From page...</h4>
                        <Select
                            className="basic-single"
                            classNamePrefix="select"
                            placeholder="Starting Page"
                            isClearable={true}
                            isSearchable={true}
                            options={this.state.selects.nodes}

                            onChange={this.changeNewFromPage}
                            value={this.state.newLink.from || ''}
                        />
                    </DialogContent>

                    <DialogContent className={classes.root} style={{ minWidth: "500px" }}>
                        <h4 style={{ color: "#999" }}>To page...</h4>

                        <Select
                            className="basic-single"
                            classNamePrefix="select"
                            placeholder="End Page"
                            isClearable={true}
                            isSearchable={true}
                            options={this.state.selects.nodes}

                            onChange={this.changeNewToPage}
                            value={this.state.newLink.to || ''}
                        />
                    </DialogContent>

                    <DialogContent>
                        <span style={{ paddingTop: "40px", color: "#f50057", display: "none" }} id="errorNoLink">Please both the start and end node!</span>
                    </DialogContent>

                    <DialogContent>
                        <span style={{ paddingTop: "40px", color: "#f50057", display: "none" }} id="errorLinkAlreadyExists">Sorry, there already exists a link between those two pages!</span>
                    </DialogContent>

                    <DialogContent>
                        <span style={{ paddingTop: "40px", color: "#f50057", display: "none" }} id="errorLinkSameNode">Sorry, the start and end page must be different!</span>
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={() => this.handleClose()} color="secondary">
                            Cancel
                        </Button>
                        <Button variant="outlined" color="primary" onClick={() => this.addNewLink()}>
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            }

            else if (this.state.modal.type == "REMOVE_LINK") {
                modal = <Dialog
                    open={this.state.modal.open}
                    onClose={() => this.handleClose()}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    classes={{ paperScrollPaper: classes.root }}
                >
                    <DialogTitle id="alert-dialog-title">{"Delete a Link"}</DialogTitle>
                    <DialogContent className={classes.root} style={{ minWidth: "500px" }}>
                        <Select
                            className="basic-single"
                            classNamePrefix="select"
                            placeholder="Link"
                            isClearable={true}
                            isSearchable={true}
                            options={this.state.selects.edges}

                            onChange={this.changeDeleteLink}
                            value={this.state.deleteLink || ''}
                        />
                    </DialogContent>

                    <DialogContent>
                        <span style={{ paddingTop: "40px", color: "#f50057", display: "none" }} id="errorNoDeleteLink">Please select the link you want to delete!</span>
                    </DialogContent>


                    <DialogActions>
                        <Button onClick={() => this.handleClose()} color="secondary">
                            Cancel
                        </Button>
                        <Button variant="outlined" color="primary" onClick={() => this.removeLink()}>
                            Confirm
                        </Button>
                    </DialogActions>
                </Dialog>
            }

            else if (this.state.modal.type == "REMOVE_NODE") {
                modal = <Dialog
                    open={this.state.modal.open}
                    onClose={() => this.handleClose()}
                    aria-labelledby="alert-dialog-title"
                    aria-describedby="alert-dialog-description"
                    classes={{ paperScrollPaper: classes.root }}
                >
                    <DialogTitle id="alert-dialog-title">{"Delete a Page"}</DialogTitle>
                    <DialogContent className={classes.root} style={{ minWidth: "500px" }}>
                        <Select
                            className="basic-single"
                            classNamePrefix="select"
                            placeholder="Page"
                            isClearable={true}
                            isSearchable={true}
                            options={this.state.selects.nodes}

                            onChange={this.changeDeleteNode}
                            value={this.state.deletePage || ''}
                        />
                    </DialogContent>

                    <DialogContent>
                        <span style={{ paddingTop: "40px", color: "#f50057", display: "none" }} id="errorNoDeletePage">Please select the node you want to delete!</span>
                    </DialogContent>


                    <DialogActions>
                        <Button onClick={() => this.handleClose()} color="secondary">
                            Cancel
                        </Button>
                        <Button variant="outlined" color="primary" onClick={() => this.removePage()}>
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
                                    <Button variant="outlined" color="primary" style={{ width: "100%" }} onClick={() => this.handleOpenAddLink()}>
                                        Add new Link
                                    </Button>
                                </Grid>
                            </Grid>

                            <Grid container spacing={2} style={{ marginTop: "20px" }}>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="secondary" size="medium" style={{ width: "100%" }} onClick={() => this.handleOpenDeleteNode()}>
                                        Remove Page
                                    </Button>
                                </Grid>
                                <Grid item md={6}>
                                    <Button variant="outlined" color="secondary" size="medium" style={{ width: "100%" }} onClick={() => this.handleOpenDeleteLink()}>
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


export default withStyles(styles)(Home)