import { Box, Button, Checkbox, CircularProgress, FormControl, FormLabel,  ListItemText,  MenuItem, Select, SelectChangeEvent,  TextField } from '@mui/material';
import React, { useEffect, useState } from 'react'
import theme from '../../theme';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { createRole, fetchPermissions } from '../../store/features/role.slice';
import { NewRole } from '../../types/model/role.model';


interface CreateRoleProps {
show:boolean;
closeCreateRole: () => void
}
const CreateRole:React.FC<CreateRoleProps> = ({show,closeCreateRole}) => {
   
    const [value, setValue] = useState<NewRole>({
       name: '',
       description: '',
       permissions: []
      });
   
      const {status,task,permissions} = useAppSelector(state=>state.role);
      const dispatch = useAppDispatch()
      useEffect(() => {
       dispatch(fetchPermissions())
      }, [])
      const handlePermissionChange = (e: SelectChangeEvent<typeof value.permissions>) => {
       console.log('e.target.value',e.target.value);
       
        setValue({
            ...value,
            permissions:typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value,
          });
      };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    dispatch(createRole({newRole:value,closeCreateRole}));
  };


  const loading = status === 'loading' && task==='create-role'
//   const permissionsLoading = status === 'loading' && task==='fetch-permissions'
  return (
    <Box  sx={{display:show?'block':'none',maxWidth:700,mx:'auto',my:4}}>

<Box component={"form"} onSubmit={handleSubmit}>
<FormControl fullWidth>
                <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
                   Name
                </FormLabel>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Enter Name"
                  value={value.name}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </FormControl>
              <FormControl fullWidth>
                <FormLabel sx={{ color: "#555555", my: 1, fontSize: "0.9rem" }}>
                   Description
                </FormLabel>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Enter Description"
                  value={value.description}
                  onChange={(e) =>
                    setValue({
                      ...value,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </FormControl>
              <FormControl fullWidth>
              <FormLabel sx={{ color: "#555", my: 1,fontSize:'0.9rem' }}>Role</FormLabel>

              <Select
                size="small"
               multiple
               value={value.permissions}
               onChange={handlePermissionChange}
               renderValue={(selected) => selected.map(s=>permissions.find(p=>p.id===s)?.codeName).join(', ')}
                // MenuProps={MenuProps}
              >
                 {permissions.map((permission) => (
            <MenuItem key={permission.id} value={permission.id}>
              <Checkbox checked={value.permissions.includes(permission.id)} />
              <ListItemText primary={permission.codeName} />
            </MenuItem>
          ))}
              </Select>
            </FormControl>
              
                           <Button
            fullWidth
                   type="submit"
                  variant="contained"
                  sx={{ textTransform: "none", color: "white" ,mt:1,fontWeight:theme.typography.fontWeightBold}}
                  disabled={loading}
                >
                 {loading ?<CircularProgress size='small'  sx={{color:'white',height:'28px !important',width:'28px !important'}} /> : 'Add role'}
                </Button>
          </Box>
    </Box>
  )
}

export default CreateRole